const jwt = require("jsonwebtoken");
const crypto = require("crypto");

function generateAccessToken(user, client) {
  return jwt.sign(
    { sub: user.id, aud: client.clientId, scope: "read" },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );
}

function generateRefreshToken() {
  return crypto.randomBytes(32).toString("hex");
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
};
