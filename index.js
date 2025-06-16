const express = require("express");
require("dotenv").config();
const session = require("express-session");
const { connectDB } = require("./config/connectDB");
const postRouter = require("./src/routes/postRoute");
const bodyParser = require("body-parser");
const authRoutes = require("./src/routes/authRoutes");
const path = require("path");
const app = express();

connectDB();

app.use(bodyParser.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

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
app.use("/api", require("./src/routes/requestRoutes"));

app.listen(process.env.PORT, () => {
  console.log(`Server is running on ${process.env.PORT}`);
});



<<<<<<< HEAD
app.use('/api', require('./src/routes/requestRoute'));
=======


>>>>>>> 5ffadf5d26382a8515670e89bb3a2c218dee7037
