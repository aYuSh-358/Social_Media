const express = require("express");
const router = express.Router();
const OAuthClient = require("../models/OAuthClient");
const OAuthCode = require("../models/OAuthCode");
const OAuthToken = require("../models/OAuthToken");
const crypto = require("crypto");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../utils/tokenUtils");

// GET /authorize
router.get("/authorize", async (req, res) => {
  const { response_type, client_id, redirect_uri } = req.query;

  if (response_type !== "code") {
    return res.status(400).json({ error: "unsupported_response_type" });
  }

  const client = await OAuthClient.findOne({ clientId: client_id });
  if (!client || !client.redirectUris.includes(redirect_uri)) {
    return res.status(400).json({ error: "invalid_client" });
  }

  // Assume the user is authenticated and has approved the request
  const code = crypto.randomBytes(20).toString("hex");
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  await OAuthCode.create({
    code,
    clientId: client_id,
    userId: req.userId, // make sure req.userId is populated (e.g., via middleware)
    redirectUri: redirect_uri,
    expiresAt,
  });

  res.redirect(`${redirect_uri}?code=${code}`);
});

// POST /token
router.post("/token", async (req, res) => {
  const {
    grant_type,
    code,
    redirect_uri,
    client_id,
    client_secret,
    refresh_token,
  } = req.body;

  const client = await OAuthClient.findOne({ clientId: client_id });
  if (!client || client.clientSecret !== client_secret) {
    return res.status(400).json({ error: "invalid_client" });
  }

  // --- AUTHORIZATION CODE GRANT ---
  if (grant_type === "authorization_code") {
    const authCode = await OAuthCode.findOne({ code, clientId: client_id });

    if (
      !authCode ||
      authCode.redirectUri !== redirect_uri ||
      authCode.expiresAt < Date.now()
    ) {
      return res.status(400).json({ error: "invalid_grant" });
    }

    const accessToken = generateAccessToken({ id: authCode.userId }, client);
    const newRefreshToken = generateRefreshToken();
    const expiresAt = new Date(Date.now() + 3600 * 1000); // 1 hour

    await OAuthToken.create({
      accessToken,
      refreshToken: newRefreshToken,
      clientId: client_id,
      userId: authCode.userId,
      expiresAt,
    });

    await OAuthCode.deleteOne({ code }); // one-time use

    return res.json({
      access_token: accessToken,
      token_type: "Bearer",
      expires_in: 3600,
      refresh_token: newRefreshToken,
    });
  }

  // --- REFRESH TOKEN GRANT ---
  else if (grant_type === "refresh_token") {
    const tokenDoc = await OAuthToken.findOne({ refreshToken: refresh_token });

    if (!tokenDoc) {
      return res.status(400).json({ error: "invalid_grant" });
    }

    const newAccessToken = generateAccessToken(
      { id: tokenDoc.userId },
      { clientId: tokenDoc.clientId }
    );

    tokenDoc.accessToken = newAccessToken;
    tokenDoc.expiresAt = new Date(Date.now() + 3600 * 1000); // 1 hour
    await tokenDoc.save();

    return res.json({
      access_token: newAccessToken,
      token_type: "Bearer",
      expires_in: 3600,
    });
  }

  // --- UNSUPPORTED GRANT ---
  else {
    return res.status(400).json({ error: "unsupported_grant_type" });
  }
});

module.exports = router;

// const express = require("express");
// const router = express.Router();
// const OAuthClient = require("../models/OAuthClient");
// const OAuthCode = require("../models/OAuthCode");
// const { verifyToken } = require("../middleware/authMiddleware");
// const crypto = require("crypto");
// const OAuthToken = require("../models/OAuthToken");
// const {
//   generateAccessToken,
//   generateRefreshToken,
// } = require("../utils/tokenUtils");

// router.get("/authorize", async (req, res) => {
//   const { response_type, client_id, redirect_uri } = req.query;

//   if (response_type !== "code") {
//     return res.status(400).json({ error: "unsupported_response_type" });
//   }

//   const client = await OAuthClient.findOne({ clientId: client_id });
//   if (!client || !client.redirectUris.includes(redirect_uri)) {
//     return res.status(400).json({ error: "invalid_client" });
//   }

//   // Assume the user approves the app (you can show a UI here)
//   const code = crypto.randomBytes(20).toString("hex");
//   const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

//   await OAuthCode.create({
//     code,
//     clientId: client_id,
//     userId: req.userId,
//     redirectUri: redirect_uri,
//     expiresAt,
//   });

//   res.redirect(`${redirect_uri}?code=${code}`);
// });

// router.post("/token", async (req, res) => {
//   const { grant_type, code, client_id, client_secret, redirect_uri } = req.body;

//   if (grant_type === "refresh_token") {
//     const tokenDoc = await OAuthToken.findOne({ refreshToken });
//     if (!tokenDoc) {
//       return res.status(400).json({ error: "invalid_grant" });
//     }

//     const newAccessToken = generateAccessToken(
//       { id: tokenDoc.userId },
//       { clientId: tokenDoc.clientId }
//     );
//     tokenDoc.accessToken = newAccessToken;
//     tokenDoc.expiresAt = new Date(Date.now() + 3600 * 1000);
//     await tokenDoc.save();

//     return res.json({
//       access_token: newAccessToken,
//       token_type: "Bearer",
//       expires_in: 3600,
//     });
//   }

//   if (grant_type !== "authorization_code") {
//     return res.status(400).json({ error: "unsupported_grant_type" });
//   }

//     else if (grant_type === "refresh_token") {
//     const token = await OAuthToken.findOne({ refreshToken: refresh_token });
//     if (!token) {
//       return res.status(400).json({ error: "invalid_grant" });
//     }

//   const client = await OAuthClient.findOne({ clientId: client_id });
//   if (
//     !client ||
//     client.clientSecret !== client_secret ||
//     !client.redirectUris.includes(redirect_uri)
//   ) {
//     return res.status(400).json({ error: "invalid_client" });
//   }

//   const authCode = await OAuthCode.findOne({ code, clientId: client_id });
//   if (
//     !authCode ||
//     authCode.redirectUri !== redirect_uri ||
//     authCode.expiresAt < Date.now()
//   ) {
//     return res.status(400).json({ error: "invalid_grant" });
//   }

//   const accessToken = generateAccessToken({ id: authCode.userId }, client);
//   const refreshToken = generateRefreshToken();
//   const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

//   await OAuthToken.create({
//     accessToken,
//     refreshToken,
//     clientId: client_id,
//     userId: authCode.userId,
//     expiresAt,
//   });

//   await OAuthCode.deleteOne({ code }); // one-time use

//   res.json({
//     access_token: accessToken,
//     token_type: "Bearer",
//     expires_in: 3600,
//     refresh_token: refreshToken,
//   });
// });

// module.exports = router;
