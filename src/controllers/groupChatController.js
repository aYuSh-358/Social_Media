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

        // if requester is an admin
        const isAdmin = group.admins.some(admin => admin._id.toString() == requesterId);
        if (!isAdmin) return res.status(403).json({ message: 'Only admins can add members' });

        // if user already in members
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



// Make another user admin (Admins Only)
exports.makeAdmin = async (req, res) => {
    try {
        const { groupId, userIdToPromote } = req.body;
        const requesterId = req.userId;

        const group = await Group.findById(groupId);
        if (!group) return res.status(404).json({ message: 'Group not found' });

        // if requester is an admin
        const isAdmin = group.admins.some(admin => admin._id.toString() == requesterId);

        if (!isAdmin) return res.status(403).json({ message: 'Only admins can promote members' });

        // if user is already an admin
        const alreadyAdmin = group.admins.some(admin => admin._id.toString() == userIdToPromote);
        if (alreadyAdmin) return res.status(400).json({ message: 'User is already an admin' });

        // if user is a member
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

//member list
exports.memberList = async (req, res) => {
    try {
        const { id } = req.params;

        const group = await Group.findById(id);
        if (!group) return res.status(404).json({ message: 'Group not found' });


        // Combine admins + members into one list, removing duplicates by _id
        const allMembersMap = new Map();

        group.admins.forEach(admin => {
            allMembersMap.set(admin._id.toString(), { _id: admin._id, name: admin.name, role: 'admin' });
        });

        group.members?.forEach(member => {
            if (!allMembersMap.has(member._id.toString())) {
                allMembersMap.set(member._id.toString(), { _id: member._id, name: member.name, role: 'member' });
            }
        });

        const allMembers = Array.from(allMembersMap.values());

        res.status(200).json({
            groupName: group.name,
            id: group._id,
            members: allMembers
        });
    } catch (err) {
        console.error("Error fetching member list:", err);
        res.status(500).json({ message: "Server error" });
    }
}

// Leave Group
exports.leaveGroup = async (req, res) => {
    try {
        const { groupId } = req.body;
        const requesterId = req.userId;

        const group = await Group.findById(groupId);
        if (!group) return res.status(404).json({ message: 'Group not found' });

        // if the user is a member or admin of the group
        const isMember = group.members.some(member => member._id.toString() == requesterId);
        const isAdmin = group.admins.some(admin => admin._id.toString() == requesterId);

        if (!isMember && !isAdmin) {
            return res.status(400).json({ message: 'You are not a member or admin of this group' });
        }

        if (isAdmin) {
            group.admins = group.admins.filter(admin => admin._id.toString() !== requesterId);
        }
        if (isMember) {
            group.members = group.members.filter(member => member._id.toString() !== requesterId);
        }

        if (group.members.length == 0 && group.admins.length == 0) {
            await group.deleteOne();
            return res.status(200).json({ message: 'Group deleted as it has no members or admins left' });
        }

        await group.save();

        res.status(200).json({ message: 'You have left the group', group });
    } catch (err) {
        console.error("Error leaving group:", err);
        res.status(500).json({ message: "Error while leaving the group" });
    }
};


// Remove Member  (Admins Only)
exports.removeMember = async (req, res) => {
    try {
        const { groupId, userIdToRemove } = req.body;
        const requesterId = req.userId;

        const group = await Group.findById(groupId);
        if (!group) return res.status(404).json({ message: 'Group not found' });

        const isAdmin = group.admins.some(admin => admin._id.toString() == requesterId);
        if (!isAdmin) return res.status(403).json({ message: 'Only admins can remove members or admins' });

        // if user to remove is the group creator
        if (group.createdBy._id.toString() == userIdToRemove) {
            return res.status(400).json({ message: 'Cannot remove the group creator' });
        }

        const isAdminToRemove = group.admins.some(admin => admin._id.toString() == userIdToRemove);
        const isMemberToRemove = group.members.some(member => member._id.toString() == userIdToRemove);

        // If the user to remove is not an admin or member
        if (!isAdminToRemove && !isMemberToRemove) {
            return res.status(404).json({ message: 'User not found in the group' });
        }

        // If the user is an admin, remove from admins
        if (isAdminToRemove) {
            group.admins = group.admins.filter(admin => admin._id.toString() !== userIdToRemove);
        }

        // If the user is a member, remove from members
        if (isMemberToRemove) {
            group.members = group.members.filter(member => member._id.toString() !== userIdToRemove);
        }

        if (group.members.length == 0 && group.admins.length == 0) {
            await group.deleteOne();
            return res.status(200).json({ message: 'Group deleted as it has no members or admins left' });
        }

        await group.save();

        res.status(200).json({ message: 'User removed from group', group });
    } catch (err) {
        console.error('Remove member/admin error:', err);
        res.status(500).json({ message: 'Error removing user from group' });
    }
};