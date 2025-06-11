const express = require("express");
const { connectDB } = require("./config/connectDB");
require("dotenv").config();

const app = express();
connectDB();

app.get("/", (req, res) => {
  res.json("I am alive...!");
});

app.listen(process.env.PORT, () => {
  console.log(`Server is running on ${process.env.PORT}`);
});
