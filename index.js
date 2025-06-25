const express = require("express");
require("dotenv").config();
const session = require("express-session");
const { connectDB } = require("./config/connectDB");
const postRouter = require("./src/routes/postRoute");
const chatRouter = require("./src/routes/chatRoutes");
const bodyParser = require("body-parser");
const authRoutes = require("./src/routes/authRoutes");
const friendRequest = require("./src/models/requestModel");
const Chat = require("./src/models/chatModels");
const requestRoute = require("./src/routes/requestRoute");
const blockRoutes = require("./src/routes/blockRoutes");
const Block = require("./src/models/blockModel");

const path = require("path");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

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

    console.log("Active Connections:", activeConnection);

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



    const alreadyBlocked = await Block.findOne({ blocker: blockerId, blocked: blockedId });
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

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
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
});

// Middleware & Routes
app.use(bodyParser.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.static(path.join(__dirname, "src/public")));

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

// Routes
app.use("/auth", authRoutes);
app.use("/post", postRouter);
app.use("/chat", chatRouter);
app.use("/api", requestRoute);
app.use("/block", blockRoutes);

server.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
