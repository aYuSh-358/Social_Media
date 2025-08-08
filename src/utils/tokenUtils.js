const jwt = require("jsonwebtoken");
const crypto = require("crypto");
require("dotenv").config();

function generateAccessToken(user, client) {
  return jwt.sign(
    { sub: user.id, aud: client.clientId, scope: "read" },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
}

function generateRefreshToken() {
  return crypto.randomBytes(32).toString("hex");
}

function base64urlEncode(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, ""); // remove padding
}

/**
 * Generate a clientId and clientSecret with encoded app name
 */
function generateClientCredentials(appName) {
  const encodedName = base64urlEncode(appName).slice(0, 24); // keep it short and consistent

  const idHex = crypto.randomBytes(32).toString("hex"); // 64 chars
  const secretHex = crypto.randomBytes(64).toString("hex"); // 128 chars

  const clientId = `${encodedName}.${idHex}`;
  const clientSecret = `${encodedName}.${secretHex}`;

  return { clientId, clientSecret };
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  generateClientCredentials,
};
