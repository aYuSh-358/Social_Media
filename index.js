const express = require("express");
const { connectDB } = require("./config/connectDB");
require("dotenv").config();
const postRouter = require("./src/routes/postRoute");

const app = express();
connectDB();

app.get("/", (req, res) => {
  res.json("I am alive...!");
});

app.use("/post", postRouter);

app.listen(process.env.PORT, () => {
  console.log(`Server is running on ${process.env.PORT}`);
});
