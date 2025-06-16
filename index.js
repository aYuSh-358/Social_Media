const express = require("express");
const { connectDB } = require("./config/connectDB");
const bodyParser = require("body-parser");
const userRoutes = require("./src/routes/userRoutes");
const authRoutes = require("./src/routes/authRoutes");

require("dotenv").config();
const session = require("express-session");
const postRouter = require("./src/routes/postRoute");

const app = express();

connectDB();

// Middleware
app.use(bodyParser.json());

// Routes
app.use("/", userRoutes);
app.use("/", authRoutes);

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
); //6 hr

app.use("/post", postRouter);

app.listen(process.env.PORT, () => {
  console.log(`Server is running on ${process.env.PORT}`);
});



app.use('/api', require('./src/routes/requestRoute'));