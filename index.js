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
const path = require("path");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
app.use(cors());

connectDB();

// Socket Implementation
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});
const activeConnection = new Map();

io.on("connection", async (socket) => {
  // console.log("a user connected", socket.id);
  let userIdForThisSocket = null;
  socket.on("registeUser", async (myId) => {
    // console.log("User is ", myId);
    userIdForThisSocket = myId;
    let userSockets = activeConnection.get(myId);
    if (!userSockets) {
      userSockets = new Set();
      activeConnection.set(myId, userSockets);
    }
    userSockets.add(socket.id);

    console.log("Active Connections:", activeConnection);
    const friend = await friendRequest.aggregate([
      {
        $match: {
          $or: [{ receiver: myId }, { sender: myId }],
          status: "accepted",
        },
      },
    ]);
    // console.log(friend);
    const onlineFriends = friend.filter((f) => {
      const friendId = f.sender === myId ? f.receiver : f.sender;
      return (
        activeConnection.has(friendId) &&
        activeConnection.get(friendId).size > 0
      );
    });

    // console.log("Online Friends (from your friend list):", onlineFriends);

    const onlineFriendIds = onlineFriends.map((f) => {
      return f.sender === myId ? f.receiver : f.sender;
    });
    // console.log("Online Friend IDs:", onlineFriendIds);
    socket.emit("onlineFriends", onlineFriendIds);

    socket.on("privateMessage", async ({ senderId, receiverId, message }) => {
      // console.log('ref', senderId, receiverId);

      const chat = new Chat({ senderId, receiverId, message });
      await chat.save();

      const receiverSocketId = activeConnection.get(receiverId);

      console.log("receiverSocketId", receiverSocketId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("receivePrivateMessage", {
          senderId,
          receiverId,
          message,
        });
      }
      // socket.emit("receivePrivateMessage", {
      //   senderId,
      //   receiverId,
      //   message,
      // });
    });
  });

  socket.on("disconnect", () => {
    console.log("user disconnected", socket.id);
  });
});

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

app.use("/auth", authRoutes);
app.use("/post", postRouter);
app.use("/chat", chatRouter);
app.use("/api", requestRoute);


server.listen(process.env.PORT, () => {
  console.log(`Server is running on ${process.env.PORT}`);
});