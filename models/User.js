const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema({
    walletAddress: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        match: /^0x[a-fA-F0-9]{40}$/,
    },
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 30,
    },
    role: {
        type: String,
        enum: ['creator', 'fan'],
        required: true,
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    twitter: { type: String, trim: true, default: null },
    instagram: { type: String, trim: true, default: null },
    createdAt: { type: Date, default: Date.now },
    campaignsCreated: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Campaign' }],
    campaignsParticipated: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Campaign' }],
    rewardsEarned: [
        {
            campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign' },
            amount: { type: Number, min: 0 },
            token: {
                address: { type: String, required: true, match: /^0x[a-fA-F0-9]{40}$/ },
                name: { type: String, required: true },
            },
            claimedAt: { type: Date, default: Date.now },
        },
    ],
})

// Indexes are automatically created by unique: true in schema definition

const User = mongoose.model('User', UserSchema)
module.exports = User
