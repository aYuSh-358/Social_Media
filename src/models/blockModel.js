const mongoose = require("mongoose");

const BlockSchema = new mongoose.Schema({
  blocker: {
    type: String,
    require: true,
  },

  blocked: {
    type: String,
    require: true,
  },
  blockedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Block", BlockSchema);
