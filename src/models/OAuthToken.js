const mongoose = require("mongoose");

const OAuthTokenSchema = new mongoose.Schema({
  accessToken: String,
  refreshToken: String,
  clientId: String,
  userId: mongoose.Schema.Types.ObjectId,
  expiresAt: Date,
});

module.exports = mongoose.model("OAuthToken", OAuthTokenSchema);
