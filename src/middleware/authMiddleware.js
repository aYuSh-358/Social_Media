const jwt = require("jsonwebtoken");

function verifyToken(req, res, next) {
  const token = req.header("Authorization");
  if (!token) return res.status(401).json({ error: "Access denied" });

  try {
    const key = token.split(" ")[1]; // Extract after "Bearer"
    const decoded = jwt.verify(key, process.env.JWT_SECRET);
    req.userId = decoded.sub || decoded.userId;
    req.userName = decoded.userName;
    console.log("Decoded token:", decoded);
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

module.exports = {
  verifyToken,
};
