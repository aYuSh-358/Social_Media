const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  post: {
    type: String,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  permission: {
    type: String,
    enum: ["0", "1", "2"],
  },
  likeBy: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
});

module.exports = mongoose.model("Post", postSchema);
