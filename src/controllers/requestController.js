const mongoose = require("mongoose");
const friendRequest = require("../models/requestModel");
const User = require("../models/authModels");
const { sendNotification } = require('../utils/sendNotification');

// Send
exports.sendRequest = async (req, res) => {
  try {
    const { senderId, receiverId } = req.body;
    const { io, activeConnection } = req;
    const senderUser = await User.findById(senderId).select("userName");

    if (senderId == receiverId) {
      return res.status(200).json({ message: "Cannot send request to yourself" });
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
// exports.checkStatus = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const request = await friendRequest.findById(id);

//     if (!request) {
//       return res.status(404).json({ message: "No request found" });
//     }

//     res.status(200).json({
//       sender: request.sender,
//       receiver: request.receiver,
//       status: request.status,
//     });
//   } catch (err) {
//     res.status(500).json({ message: "Server error" });
//   }
// };


//Check status
exports.checkStatus = async (req, res) => {
  try {
    const { id: userId } = req.params;

    // Find requests where user is sender or receiver
    const requests = await friendRequest.find({
      $or: [{ sender: userId }, { receiver: userId }]
    });

    if (!requests.length) {
      return res.status(404).json({ message: "No requests found" });
    }

    const userIds = new Set();
    requests.forEach(req => {
      userIds.add(req.sender.toString());
      userIds.add(req.receiver.toString());
    });

    const users = await User.find({ _id: { $in: Array.from(userIds) } }).select('userName userProfilePhoto');

    const userMap = {};
    users.forEach(user => {
      userMap[user._id.toString()] = user;
    });

    const sentRequests = [];
    const receivedRequests = [];

    requests.forEach(req => {
      const data = {
        id: req._id,
        status: req.status,
        //createdAt: req.createdAt
      };

      if (req.sender.toString() == userId) {
        // User sent the request
        const receiver = userMap[req.receiver.toString()];
        data.receiver = req.receiver;
        data.receiverName = receiver?.userName || 'Unknown';
        data.receiverProfilePhoto = receiver?.userProfilePhoto || null;
        sentRequests.push(data);

      } else {
        // User received the request
        const sender = userMap[req.sender.toString()];
        data.sender = req.sender;
        data.senderName = sender?.userName || 'Unknown';
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

    const receiverUser = await User.findById(request.receiver).select("userName");

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















