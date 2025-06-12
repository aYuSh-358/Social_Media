const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  post: {
    type: String,
    require: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    require: true,
  },
});

module.exports = mongoose.model("Post", postSchema);
