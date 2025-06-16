const mongoose = require("mongoose");

const postCommentsSchema = new mongoose.Schema({
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Post",
    require: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    require: true,
  },
  comment: {
    type: String,
    require: true,
  },
});

module.exports = mongoose.model("Comment", postCommentsSchema);
