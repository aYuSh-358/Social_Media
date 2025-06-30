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
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     example: 6671eac418a3d2a5f4e3c9f7
 *                   userId:
 *                     type: string
 *                     example: 60dbf9d3d1fd5c0015f6b2e0
 *                   senderId:
 *                     type: string
 *                     example: 60f5a3f3a7f9d50015c2e123
 *                   type:
 *                     type: string
 *                     enum: [follow-request, follow-accepted, like, comment]
 *                     example: comment
 *                   postId:
 *                     type: string
 *                     example: 60e325b7c45b4b0015d0637f
 *                   seen:
 *                     type: boolean
 *                     example: false
 *                   message:
 *                     type: string
 *                     example: Alice commented on your post
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                     example: 2024-06-24T12:00:00.000Z
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *                     example: 2024-06-24T12:00:00.000Z
 *       500:
 *         description: Failed to fetch notifications
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Failed to fetch notifications
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
