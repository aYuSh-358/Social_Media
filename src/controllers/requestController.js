const mongoose = require("mongoose");
const friendRequest = require("../models/requestModel");
const User = require("../models/authModels");
const { sendNotification } = require("../utils/sendNotification");

// Send
/**
 * @swagger
 * /api/sendRequest:
 *   post:
 *     summary: Send a friend request
 *     description: Sends a friend request from one user to another. Prevents self-requests and duplicates.
 *     tags:
 *       - Requests
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - senderId
 *               - receiverId
 *             properties:
 *               senderId:
 *                 type: string
 *                 example: 60dbf9d3d1fd5c0015f6b2e0
 *               receiverId:
 *                 type: string
 *                 example: 60f5a3f3a7f9d50015c2e123
 *     responses:
 *       200:
 *         description: Request sent or already exists
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: Friend request sent
 *                 - type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: Cannot send request to yourself
 *                 - type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: Friend request already sent
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Internal server error
 */
exports.sendRequest = async (req, res) => {
  try {
    const { senderId, receiverId } = req.body;
    const { io, activeConnection } = req;
    const senderUser = await User.findById(senderId).select("userName");

    if (senderId == receiverId) {
      return res
        .status(200)
        .json({ message: "Cannot send request to yourself" });
    }

    const existing = await friendRequest.findOne({
      sender: senderId,
      receiver: receiverId,
    });

    if (existing) {
      return res.status(200).json({ message: "Friend request already sent" });
    }

    const request = new friendRequest({
      sender: senderId,
      receiver: receiverId,
      status: "pending",
    });

    await request.save();
    res.status(200).json({ message: "Friend request sent" });

    // Create notification
    await sendNotification({
      userId: receiverId,
      senderId: senderId,
      type: "follow-request",
      message: `${senderUser.userName} sent you a friend request`,
      io,
      activeConnection,
    });
  } catch (error) {
    console.error("Error sending friend request:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

//status
/**
 * @swagger
 * /api/checkStatus/{id}:
 *   get:
 *     summary: Check status of all friend requests for a user
 *     description: Returns all sent and received friend requests for a user by their ID.
 *     tags:
 *       - Requests
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: User ID to check requests for
 *         schema:
 *           type: string
 *           example: 665c3f9cb5f2e80012c21f0d
 *     responses:
 *       200:
 *         description: Friend requests found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sentRequests:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       status:
 *                         type: string
 *                         enum: [pending, accepted, rejected]
 *                       receiver:
 *                         type: string
 *                       receiverName:
 *                         type: string
 *                       receiverProfilePhoto:
 *                         type: string
 *                 receivedRequests:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       status:
 *                         type: string
 *                         enum: [pending, accepted, rejected]
 *                       sender:
 *                         type: string
 *                       senderName:
 *                         type: string
 *                       senderProfilePhoto:
 *                         type: string
 *       404:
 *         description: No requests found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: No requests found
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Server error
 */
exports.checkStatus = async (req, res) => {
  try {
    const { id: userId } = req.params;

    // Find requests where user is sender or receiver
    const requests = await friendRequest.find({
      $or: [{ sender: userId }, { receiver: userId }],
    });

    if (!requests.length) {
      return res.status(404).json({ message: "No requests found" });
    }

    const userIds = new Set();
    requests.forEach((req) => {
      userIds.add(req.sender.toString());
      userIds.add(req.receiver.toString());
    });

    const users = await User.find({ _id: { $in: Array.from(userIds) } }).select(
      "userName userProfilePhoto"
    );

    const userMap = {};
    users.forEach((user) => {
      userMap[user._id.toString()] = user;
    });

    const sentRequests = [];
    const receivedRequests = [];

    requests.forEach((req) => {
      const data = {
        id: req._id,
        status: req.status,
        //createdAt: req.createdAt
      };

      if (req.sender.toString() == userId) {
        // User sent the request
        const receiver = userMap[req.receiver.toString()];
        data.receiver = req.receiver;
        data.receiverName = receiver?.userName || "Unknown";
        data.receiverProfilePhoto = receiver?.userProfilePhoto || null;
        sentRequests.push(data);
      } else {
        // User received the request
        const sender = userMap[req.sender.toString()];
        data.sender = req.sender;
        data.senderName = sender?.userName || "Unknown";
        data.senderProfilePhoto = sender?.userProfilePhoto || null;
        receivedRequests.push(data);
      }
    });

    return res.status(200).json({ sentRequests, receivedRequests });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Accept or Reject
/**
 * @swagger
 * /api/respondToRequest/{id}:
 *   put:
 *     summary: Respond to a friend request
 *     description: Accepts or rejects a friend request by updating its status.
 *     tags:
 *       - Requests
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the friend request
 *         schema:
 *           type: string
 *           example: 665c3f9cb5f2e80012c21f0d
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [accepted, rejected]
 *                 example: accepted
 *     responses:
 *       200:
 *         description: Friend request successfully updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Request accepted
 *       400:
 *         description: Invalid status or input
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invalid status
 *       404:
 *         description: Friend request not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Request not found
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Server error
 */
exports.respondToRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const { io, activeConnection } = req;

    if (!["accepted", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const request = await friendRequest.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    res.status(200).json({ message: `Request ${status}` });

    const receiverUser = await User.findById(request.receiver).select(
      "userName"
    );

    // Create notification for accepted request
    await sendNotification({
      userId: request.sender,
      senderId: request.receiver,
      type: "follow-accepted",
      message: `Your friend request has been ${status} by ${receiverUser.userName}`,
      io,
      activeConnection,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

//friend list
/**
 * @swagger
 * /api/friendList/{id}:
 *   get:
 *     summary: Get list of all accepted friends for a user
 *     description: Returns all users who have an accepted friend request with the given user ID.
 *     tags:
 *       - Requests
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: User ID to retrieve friends for
 *         schema:
 *           type: string
 *           example: 60dbf9d3d1fd5c0015f6b2e0
 *     responses:
 *       200:
 *         description: List of friends or no friends found
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   properties:
 *                     friends:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           userName:
 *                             type: string
 *                             example: Alice
 *                           userEmail:
 *                             type: string
 *                             example: alice@example.com
 *                     totalFriends:
 *                       type: integer
 *                       example: 2
 *                 - type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: No friends found
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Server error
 */
exports.friendList = async (req, res) => {
  try {
    const userId = req.params.id;

    const acceptedRequests = await friendRequest.find({
      status: "accepted",
      $or: [{ sender: userId }, { receiver: userId }],
    });

    if (!acceptedRequests.length) {
      return res.status(200).json({ message: "No friends found" });
    }

    const friendIds = acceptedRequests.map((req) =>
      req.sender == userId ? req.receiver : req.sender
    );

    // Remove duplicates
    const uniqueFriendIds = [...new Set(friendIds)];

    const friends = await User.find({ _id: { $in: uniqueFriendIds } }).select(
      "userName userEmail"
    );

    res.status(200).json({ friends, totalFriends: friends.length });
  } catch (error) {
    console.error("Error fetching friend list:", error);
    res.status(500).json({ message: "Server error" });
  }
};
