
const friendRequest = require('../models/requestModels');


// send friend request
exports.sendRequest = async (req, res) => {
  const senderId = req.body.senderId;
  const receiverId = req.body.receiverId;

  if (senderId == receiverId) {
    return res.status(200).json({ message: "you cannot send request to yourself" });
  }

  const alreadySent = await FriendRequest.findOne({
    sender: senderId,
    receiver: receiverId
  });

  if (alreadySent) {
    return res.status(200).json({ message: "Friend request already sent" });
  }

  const request = new FriendRequest({ sender: senderId, receiver: receiverId });
  await request.save();

  res.status(200).json({ message: "Friend request sent successfully" });
};






// View Friend List
exports.viewRequests = async (req, res) => {
  const userId = req.params.userId;

  const acceptedFriends = await FriendRequest.find({
    $or: [{ sender: userId }, { receiver: userId }],
    status: 'accepted'
  })

  // const acceptedFriends = await FriendRequest.find({
  //   $or: [{ sender: userId }, { receiver: userId }],
  //   status: 'accepted'
  // }).populate('sender receiver', 'name email');

  const friends = acceptedFriends.map(req => req.sender._id.toString() == userId ? req.receiver : req.sender);

  res.status(200).json({ message: "Friend list", friends });
};






//status
exports.statusRequest = async (req, res) => {
  const requestId = req.params.id;
  const { status } = req.body;

  if (!['accepted', 'rejected'].includes(status)) {
    return res.status(200).json({ message: "pending request" });
  }

  const request = await FriendRequest.findByIdAndUpdate(requestId, { status }, { new: true });

  if (!request) {
    return res.status(200).json({ message: "Friend request not found" });
  }

  res.status(200).json({ message: `Friend request ${status}` });
};


