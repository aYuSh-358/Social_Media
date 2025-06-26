const Notification = require("../models/notificationModels");

exports.getUserNotifications = async (req, res) => {
    try {
        const userId = req.params.id;
        const notifications = await Notification.find({ userId }).sort({ createdAt: -1 });
        res.status(200).json(notifications);
        console.log(`Notifications fetched for user ${userId}`);

    } catch (err) {
        res.status(500).json({ message: "Failed to fetch notifications" });
    }
};
