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
 *       - Request
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
 *             examples:
 *               Success:
 *                 value:
 *                   message: Friend request sent
 *               SelfRequest:
 *                 value:
 *                   message: Cannot send request to yourself
 *               Duplicate:
 *                 value:
 *                   message: Friend request already sent
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             example:
 *               message: Server error.
 *               error: "Internal server error message"
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
 *     summary: Check status of a friend request
 *     description: Returns the status, sender, and receiver of a specific friend request by ID.
 *     tags:
 *       - Request
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the friend request
 *         schema:
 *           type: string
 *           example: 665c3f9cb5f2e80012c21f0d
 *     responses:
 *       200:
 *         description: Friend request status found
 *         content:
 *           application/json:
 *             example:
 *               sender: 60dbf9d3d1fd5c0015f6b2e0
 *               receiver: 60f5a3f3a7f9d50015c2e123
 *               status: pending
 *       404:
 *         description: Request not found
 *         content:
 *           application/json:
 *             example:
 *               message: No request found
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             example:
 *               message: Server error
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
 *       - Request
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
 *             example:
 *               message: Request accepted
 *       400:
 *         description: Invalid status or input
 *         content:
 *           application/json:
 *             example:
 *               message: Invalid status
 *       404:
 *         description: Friend request not found
 *         content:
 *           application/json:
 *             example:
 *               message: Request not found
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             example:
 *               message: Server error
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
 *       - Request
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
 *             examples:
 *               FriendsFound:
 *                 value:
 *                   totalFriends: 2
 *                   friends:
 *                     - userName: Alice
 *                       userEmail: alice@example.com
 *                     - userName: Bob
 *                       userEmail: bob@example.com
 *               NoFriends:
 *                 value:
 *                   message: No friends found
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             example:
 *               message: Server error
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
