const express = require("express");
require("dotenv").config();
const session = require("express-session");
const { connectDB } = require("./config/connectDB");
const Story = require("./src/models/storyModels");
const postRouter = require("./src/routes/postRoute");
const chatRouter = require("./src/routes/chatRoutes");
const bodyParser = require("body-parser");
const authRoutes = require("./src/routes/authRoutes");
const friendRequest = require("./src/models/requestModel");
const Chat = require("./src/models/chatModels");
const requestRoute = require("./src/routes/requestRoute");
const storyRoute = require("./src/routes/storyRoutes");
const blockRoutes = require("./src/routes/blockRoutes");
const Block = require("./src/models/blockModel");
const notificationRoute = require("./src/routes/notificationRoute");
const groupRoutes = require("./src/routes/groupChatRoutes");
const path = require("path");
const fs = require("fs");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const { sendNotification } = require("./src/utils/sendNotification");
const Notification = require("./src/models/notificationModels");
const { swaggerUi, swaggerSpec } = require("./src/middleware/swagger");

const app = express();
app.use(cors());

connectDB();

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});
const activeConnection = new Map();

io.on("connection", async (socket) => {
  let userIdForThisSocket = null;

  socket.on("registerUser", async (myId) => {
    userIdForThisSocket = myId;
    // console.log(userIdForThisSocket);

    socket.userId = myId;
    let userSockets = activeConnection.get(myId);
    if (!userSockets) {
      userSockets = new Set();
      activeConnection.set(myId, userSockets);
    }
    userSockets.add(socket.id);

    // console.log(`User ${myId} registered with socket ${socket.id}`);
    // console.log("Active Connections:", activeConnection);
    const friendsOfConnectedUser = await friendRequest.find({
      $or: [{ receiver: myId }, { sender: myId }],
      status: "accepted",
    });

    const friendIdsOfConnectedUser = friendsOfConnectedUser.map((f) =>
      f.sender.toString() === myId ? f.receiver.toString() : f.sender.toString()
    );

    const onlineFriendIdsForNewUser = friendIdsOfConnectedUser.filter(
      (friendId) =>
        activeConnection.has(friendId) &&
        activeConnection.get(friendId).size > 0
    );
    // console.log(onlineFriendIdsForNewUser);

    socket.emit("onlineFriends", onlineFriendIdsForNewUser);

    for (const friendId of friendIdsOfConnectedUser) {
      if (activeConnection.has(friendId)) {
        const friendSockets = activeConnection.get(friendId);
        if (friendSockets.size > 0) {
          const friendsOfThisFriend = await friendRequest.find({
            $or: [{ receiver: friendId }, { sender: friendId }],
            status: "accepted",
          });
          const friendIdsOfThisFriend = friendsOfThisFriend.map((f) =>
            f.sender.toString() === friendId
              ? f.receiver.toString()
              : f.sender.toString()
          );
          const onlineFriendIdsForFriend = friendIdsOfThisFriend.filter(
            (id) =>
              activeConnection.has(id) && activeConnection.get(id).size > 0
          );
          friendSockets.forEach((socketId) => {
            io.to(socketId).emit("onlineFriends", onlineFriendIdsForFriend);
          });
        }
      }
    }
  });

  socket.on("blockUser", async (data) => {
    const blockerId = socket.userId;
    const blockedId = data.blockedId;

    const alreadyBlocked = await Block.findOne({
      blocker: blockerId,
      blocked: blockedId,
    });
    if (!alreadyBlocked) {
      await Block.create({ blocker: blockerId, blocked: blockedId });
      socket.emit("userBlocked", { blockedId });
    }
  });

  socket.on("privateMessage", async ({ senderId, receiverId, message }) => {
    const isBlocked = await Block.findOne({
      blocker: receiverId,
      blocked: senderId,
    });

    if (isBlocked) {
      socket.emit("messageBlocked", { receiverId });
      return;
    }

    const chat = new Chat({ senderId, receiverId, message });
    await chat.save();

    const receiverSocketIds = activeConnection.get(receiverId);
    if (receiverSocketIds) {
      receiverSocketIds.forEach((socketId) => {
        io.to(socketId).emit("receivePrivateMessage", {
          senderId,
          receiverId,
          message,
        });
      });
    }
  });

  socket.on("privateFile", async (data, callback) => {
    const { senderId, receiverId, filename, filetype, data: fileBuffer } = data;

    const uploadDir = path.join(__dirname, "uploads", "chat_files");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const uniqueName = `${Date.now()}_${filename}`;
    const filePath = path.join(uploadDir, uniqueName);

    fs.writeFile(filePath, Buffer.from(fileBuffer), async (err) => {
      if (err) {
        console.error("File write error:", err);
        callback({ status: "failure", error: err.message });
        return;
      }

      const fileUrl = `/uploads/chat_files/${uniqueName}`;

      const chat = new Chat({
        senderId,
        receiverId,
        message: `Sent a file: ${filename}`,
        attachments: [fileUrl],
      });
      await chat.save();

      const receiverSockets = activeConnection.get(receiverId);
      if (receiverSockets) {
        receiverSockets.forEach((socketId) => {
          io.to(socketId).emit("receivePrivateMessage", {
            senderId,
            receiverId,
            message: `Sent a file: <a href="${fileUrl}" target="_blank">${filename}</a>`,
            attachments: [fileUrl],
          });
        });
      }

      callback({ status: "success", fileUrl });
    });
  });

  socket.on("disconnect", async () => {
    if (socket.userId) {
      const userSockets = activeConnection.get(socket.userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          activeConnection.delete(socket.userId);
          // console.log(`User ${socket.userId} is now offline.`);

          const friendsOfDisconnectedUser = await friendRequest.find({
            $or: [{ receiver: socket.userId }, { sender: socket.userId }],
            status: "accepted",
          });

          for (const friend of friendsOfDisconnectedUser) {
            const friendId =
              friend.sender.toString() === socket.userId
                ? friend.receiver.toString()
                : friend.sender.toString();
            if (activeConnection.has(friendId)) {
              const friendSockets = activeConnection.get(friendId);
              if (friendSockets.size > 0) {
                const friendsOfThisFriend = await friendRequest.find({
                  $or: [{ receiver: friendId }, { sender: friendId }],
                  status: "accepted",
                });
                const friendIdsOfThisFriend = friendsOfThisFriend.map((f) =>
                  f.sender.toString() === friendId
                    ? f.receiver.toString()
                    : f.sender.toString()
                );
                const onlineFriendIdsForFriend = friendIdsOfThisFriend.filter(
                  (id) =>
                    activeConnection.has(id) &&
                    activeConnection.get(id).size > 0
                );
                friendSockets.forEach((socketId) => {
                  io.to(socketId).emit(
                    "onlineFriends",
                    onlineFriendIdsForFriend
                  );
                });
              }
            }
          }
        }
      }
    }
    // console.log(`Socket ${socket.id} disconnected.`);
    // console.log("Active Connections:", activeConnection);
  });

  socket.on("sendNotification", async ({ userId, notification }) => {
    const userSockets = activeConnection.get(userId);
    if (userSockets && userSockets.size > 0) {
      userSockets.forEach((socketId) => {
        io.to(socketId).emit("receiveNotification", notification);
      });
    } else {
      // console.log(
      //   `User ${userId} is offline. Saving notification in database.`
      // );
      await sendNotification({
        userId,
        senderId: notification.senderId,
        type: notification.type,
        message: notification.message,
        io,
        activeConnection,
      });
    }
    // console.log(`Notification sent to user ${userId}:`, notification);
  });
});

app.use(bodyParser.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.static(path.join(__dirname, "src/public")));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get("/", (req, res) => {
  res.json("I am alive...!");
});

app.use(
  session({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: parseInt(process.env.JWT_EXPIRE) },
  })
);

app.use((req, res, next) => {
  req.io = io;
  req.activeConnection = activeConnection;
  next();
});

app.use("/auth", authRoutes);
app.use("/post", postRouter);
app.use("/story", storyRoute);
app.use("/chat", chatRouter);
app.use("/api", requestRoute);
app.use("/block", blockRoutes);
app.use("/notification", notificationRoute);
app.use("/group", groupRoutes);

const updateStoryStatus = async (req, res) => {
  const stories = await Story.find();
  let now = new Date();
  for (const story of stories) {
    let createTime = new Date(story.createdAt);
    const timeDifference = now - createTime;
    const minutesPassed = Math.floor(timeDifference / (1000 * 60));
    if (minutesPassed >= 1440 && story.status !== "0") {
      story.status = "0";
      await story.save();
    }
  }
};

setInterval(updateStoryStatus, 60000);

server.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
