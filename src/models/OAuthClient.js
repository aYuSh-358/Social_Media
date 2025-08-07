const mongoose = require("mongoose");

const OAuthClientSchema = new mongoose.Schema({
  name: String,
  clientId: { type: String, unique: true },
  clientSecret: String,
  redirectUris: [String],
  grants: [String], // e.g., ['authorization_code', 'refresh_token']
});

module.exports = mongoose.model("OAuthClient", OAuthClientSchema);
