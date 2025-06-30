const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
  {
    senderId: {
      // type: mongoose.Schema.Types.ObjectId,
      // ref: "User",
      type: String,
      require: true,
    },
    receiverId: {
      // type: mongoose.Schema.Types.ObjectId,
      // ref: "User",
      type: String,
      require: true,
    },
    message: {
      type: String,
      require: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Chat", chatSchema);
