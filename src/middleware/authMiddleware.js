// middleware/authMiddleware.js

const jwt = require('jsonwebtoken');
function verifyToken(req, res, next) {
    const token = req.header('Authorization');
    if (!token) return res.status(401).json({ error: 'Access denied' });
    try {
        const key = token.split(' ')[1]
        const decoded = jwt.verify(key, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        console.log(decoded)
        next();
    } catch (error) {
        console.log(error);

        res.status(401).json({ error: 'Invalid token' });
    }
};

module.exports = verifyToken;