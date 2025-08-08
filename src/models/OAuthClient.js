const mongoose = require("mongoose");

const OAuthClientSchema = new mongoose.Schema({
  name: { type: String, unique: true },
  clientId: { type: String, unique: true },
  clientSecret: String,
  redirectUris: [String],
  grants: [String],
});

module.exports = mongoose.model("OAuthClient", OAuthClientSchema);
