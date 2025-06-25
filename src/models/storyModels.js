var mongoose = require("mongoose");

var storySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    story: {
      type: String,
      require: true,
    },
    permissions: {
      type: String,
      enum: ["0", "1", "2"],
      default: "2",
      required: true,
    },
    status: {
      type: String,
      enum: ["0", "1"],
      default: "1",
      require: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Story", storySchema);
