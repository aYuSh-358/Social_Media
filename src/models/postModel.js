const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  post: {
    type: String,
  },
  Event: {
    type: String,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    require: true,
  },
  permission: {
    type: String,
    enum: ["0", "1", "2"],
  },
  caption: {
    type: String,
  },
  likeBy: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  comments: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      comment: {
        type: String,
        required: true,
      },
    },
  ],
});

module.exports = mongoose.model("Post", postSchema);
