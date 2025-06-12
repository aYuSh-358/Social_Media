const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({

    userName: { type: String, required: true },
    userEmail: { type: String, required: true },
    userPassword: { type: String, required: true },
    userDOB: { type: String, required: true },
    userMobileNo: { type: String },
    userAddress: { type: String },
    userProfilePhoto: {}

});

module.exports = mongoose.model("User", userSchema);