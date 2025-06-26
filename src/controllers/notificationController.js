const Notification = require("../models/notificationModels");

/**
 * @swagger
 * /notification/getUserNotifications/{id}:
 *   get:
 *     summary: Get notifications for a user
 *     description: Retrieves a list of notifications for the specified user ID, sorted by newest first.
 *     tags:
 *       - Notifications
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the user to fetch notifications for
 *         schema:
 *           type: string
 *           example: 60dbf9d3d1fd5c0015f6b2e0
 *     responses:
 *       200:
 *         description: List of notifications
 *         content:
 *           application/json:
 *             example:
 *               - _id: "6671eac418a3d2a5f4e3c9f7"
 *                 userId: "60dbf9d3d1fd5c0015f6b2e0"
 *                 senderId: "60f5a3f3a7f9d50015c2e123"
 *                 type: "comment"
 *                 message: "Alice commented on your post"
 *                 createdAt: "2024-06-24T12:00:00.000Z"
 *       500:
 *         description: Failed to fetch notifications
 *         content:
 *           application/json:
 *             example:
 *               message: Failed to fetch notifications
 */

exports.getUserNotifications = async (req, res) => {
  try {
    const userId = req.params.id;
    const notifications = await Notification.find({ userId }).sort({
      createdAt: -1,
    });
    res.status(200).json(notifications);
    console.log(`Notifications fetched for user ${userId}`);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
};
