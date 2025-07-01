const Group = require('../models/groupChatModels');
const User = require('../models/authModels');
const { default: mongoose } = require('mongoose');

//Create Group
exports.createGroup = async (req, res) => {
    try {
        const { name } = req.body;
        const userId = req.userId;
        const userName = req.userName;

        const group = await Group.create({
            name,
            createdBy: {
                _id: userId,
                name: userName
            },
            // createdByName: userName,
            // members: [userId],
            admins: [{
                _id: userId,
                name: userName
            }],
        });

        res.status(200).json({ message: 'Group created', group });
    } catch (err) {
        res.status(500).json({ message: 'error in group creation' });
    }
};



// Add Member to Group (Admins Only)
exports.addMember = async (req, res) => {
    try {
        const { groupId, userIdToAdd } = req.body;
        const requesterId = req.userId;

        const group = await Group.findById(groupId);
        if (!group) return res.status(404).json({ message: 'Group not found' });

        // Check if requester is an admin
        const isAdmin = group.admins.some(admin => admin._id.toString() == requesterId);
        if (!isAdmin) return res.status(403).json({ message: 'Only admins can add members' });

        // Check if user already in members
        const isAlreadyMember = group.members?.some(member => member._id.toString() == userIdToAdd);
        if (isAlreadyMember) return res.status(400).json({ message: 'User already in group' });

        // Get user details
        const user = await User.findById(userIdToAdd).select('userName');
        if (!user) return res.status(404).json({ message: 'User to add not found' });

        // Add user to members
        group.members = group.members || [];
        group.members.push({ _id: userIdToAdd, name: user.userName });
        await group.save();

        res.status(200).json({ message: 'User added to group', group });
    } catch (err) {
        console.error('Add member error:', err);
        res.status(500).json({ message: 'Error while adding member' });
    }
};



// Make another user admin
exports.makeAdmin = async (req, res) => {
    try {
        const { groupId, userIdToPromote } = req.body;
        const requesterId = req.userId;

        const group = await Group.findById(groupId);
        if (!group) return res.status(404).json({ message: 'Group not found' });

        // Check if requester is an admin
        const isAdmin = group.admins.some(admin => admin._id.toString() == requesterId);

        if (!isAdmin) return res.status(403).json({ message: 'Only admins can promote members' });

        // Check if user is already an admin
        const alreadyAdmin = group.admins.some(admin => admin._id.toString() == userIdToPromote);
        if (alreadyAdmin) return res.status(400).json({ message: 'User is already an admin' });

        // Check if user is a member
        const memberIndex = group.members?.findIndex(member => member._id.toString() == userIdToPromote);
        if (memberIndex == -1 || memberIndex == undefined) {
            return res.status(400).json({ message: 'User is not a member' });
        }

        // Get user details
        const user = await User.findById(userIdToPromote).select('userName');
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Promote: remove from members and add to admins
        const [promotedUser] = group.members.splice(memberIndex, 1);
        group.admins.push({ _id: userIdToPromote, name: user.userName });

        await group.save();

        res.status(200).json({ message: 'User promoted to admin', group });
    } catch (err) {
        console.error('Make admin error:', err);
        res.status(500).json({ message: 'Error promoting user to admin' });
    }
};


// // Export all functions
// module.exports = {
//     createGroup,
//     sendGroupMessage,
//     getGroupMessages,
//     getUserGroups,
//     addGroupMember,
//     removeGroupMember,
//     getGroupDetails,
//     updateGroupDetails,
//     deleteGroup
// };



