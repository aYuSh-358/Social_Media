// middleware/authMiddleware.js

const jwt = require("jsonwebtoken");
function verifyToken(req, res, next) {
  const token = req.header("Authorization");
  if (!token) return res.status(401).json({ error: "Access denied" });
  try {
    const key = token.split(" ")[1];
    const decoded = jwt.verify(key, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    req.userName = decoded.userName
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
}

module.exports = verifyToken;
