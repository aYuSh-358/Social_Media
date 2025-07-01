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

  socket.on("registeUser", async (myId) => {
    userIdForThisSocket = myId;
    socket.userId = myId;

    let userSockets = activeConnection.get(myId);
    if (!userSockets) {
      userSockets = new Set();
      activeConnection.set(myId, userSockets);
    }
    userSockets.add(socket.id);

    // console.log("Active Connections:", activeConnection);

    // Send online friends
    const friends = await friendRequest.aggregate([
      {
        $match: {
          $or: [{ receiver: myId }, { sender: myId }],
          status: "accepted",
        },
      },
    ]);

    const onlineFriends = friends.filter((f) => {
      const friendId = f.sender === myId ? f.receiver : f.sender;
      return (
        activeConnection.has(friendId) &&
        activeConnection.get(friendId).size > 0
      );
    });

    const onlineFriendIds = onlineFriends.map((f) =>
      f.sender === myId ? f.receiver : f.sender
    );
    socket.emit("onlineFriends", onlineFriendIds);
  });

  //  block a user
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

  //attachment
  socket.on("privateFile", async (data, callback) => {
    const { senderId, receiverId, filename, filetype, data: fileBuffer } = data;

    const uploadDir = path.join(__dirname, "uploads", "chat_files");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const uniqueName = `${filename}`;
    const filePath = path.join(uploadDir, uniqueName);

    fs.writeFile(filePath, Buffer.from(fileBuffer), async (err) => {
      if (err) {
        console.error("File write error:", err);
        callback({ status: "failure", error: err.message });
        return;
      }

      const fileUrl = `/uploads/chat_files/${uniqueName}`;

      // Save message with attachment
      const chat = new Chat({
        senderId,
        receiverId,
        message: "",
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

  socket.on("disconnect", () => {
    // console.log("user disconnected", socket.id);
    for (const [userId, sockets] of activeConnection.entries()) {
      if (sockets.has(socket.id)) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          activeConnection.delete(userId);
        }
        break;
      }
    }
  });

  // Listen for notifications sent from clients
  socket.on("sendNotification", async ({ userId, notification }) => {
    const userSockets = activeConnection.get(userId);
    if (userSockets) {
      userSockets.forEach((socketId) => {
        io.to(socketId).emit("receiveNotification", notification);
      });
    } else {
      // User offline - save notification in DB
      console.log(
        `User ${userId} is offline. Saving notification in database.`
      );
      await sendNotification({
        userId,
        senderId: notification.senderId,
        type: notification.type,
        message: notification.message,
        io,
        activeConnection,
      });
    }
    console.log(`Notification sent to user ${userId}:`, notification);
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

app.use((req, res, next) => {
  req.io = io;
  req.activeConnection = activeConnection;
  next();
});

// Routes
app.use("/auth", authRoutes);
app.use("/post", postRouter);
app.use("/story", storyRoute);
app.use("/chat", chatRouter);
app.use("/api", requestRoute);
app.use("/block", blockRoutes);
app.use("/notification", notificationRoute);

const updateStoryStatus = async (req, res) => {
  const stories = await Story.find();
  let now = new Date();
  stories.map(async (story) => {
    // console.log("story : ", story);
    let createTime = new Date(story.createdAt);
    timedifference = now - createTime;
    const hoursePassed = Math.floor(timedifference / (1000 * 60));
    if (hoursePassed >= 1439) {
      story.status = "0";
    }
    await story.save();
  });
};

setInterval(updateStoryStatus, 60000);

server.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
