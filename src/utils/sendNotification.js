const Notification = require("../models/notificationModels");

const sendNotification = async ({ userId, senderId, type, postId = null, message = null, io, activeConnection }) => {
    try {
        if (userId.toString() === senderId.toString()) return;

        const notification = new Notification({ userId, senderId, type, postId, message });
        const savedNotification = await notification.save();

        const socketIds = activeConnection.get(userId.toString());
        if (socketIds && socketIds.size > 0) {
            // Send to all sockets of the user
            for (const socketId of socketIds) {
                io.to(socketId).emit("newNotification", savedNotification);
            }
        }

        return savedNotification;
    } catch (err) {
        console.error("Notification Error:", err.message);
    }
};

module.exports = { sendNotification };

