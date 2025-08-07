// models/OAuthCode.js
const mongoose = require("mongoose");

const OAuthCodeSchema = new mongoose.Schema({
  code: String,
  clientId: String,
  userId: mongoose.Schema.Types.ObjectId,
  redirectUri: String,
  expiresAt: Date,
});

module.exports = mongoose.model("OAuthCode", OAuthCodeSchema);
