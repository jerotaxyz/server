const mongoose = require('mongoose')

const CampaignSchema = new mongoose.Schema({
    creatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: {
        type: String,
        required: true,
        trim: true,
        minlength: 3,
        maxlength: 100,
    },
    description: { type: String, trim: true, maxlength: 1000 },
    budget: {
        amount: { type: Number, required: true, min: 0 },
        token: {
            address: { type: String, required: true, match: /^0x[a-fA-F0-9]{40}$/ },
            name: { type: String, required: true },
        },
    },
    rewardRules: [
        {
            action: {
                type: String,
                enum: ['stream', 'share', 'comment', 'like', 'follow'],
                required: true,
            },
            rewardAmount: { type: Number, required: true, min: 0.01 },
            token: {
                address: { type: String, required: true, match: /^0x[a-fA-F0-9]{40}$/ },
                name: { type: String, required: true },
            },
            maxClaims: { type: Number, min: 0 },
        },
    ],
    status: { type: String, enum: ['draft', 'active', 'completed', 'paused'], default: 'draft' },
    startDate: { type: Date, required: true },
    endDate: {
        type: Date,
        required: true,
        validate: {
            validator: function (v) {
                return v > this.startDate
            },
            message: 'End date must be after start date',
        },
    },
    contentUrl: { type: String, required: true, trim: true },
    totalTVL: { type: Number, default: 0, min: 0 },
    participants: [
        {
            userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            actions: [
                {
                    actionType: {
                        type: String,
                        enum: ['stream', 'share', 'comment', 'like', 'follow'],
                    },
                    verifiedAt: { type: Date, default: Date.now },
                    proof: { type: String },
                },
            ],
        },
    ],
    createdAt: { type: Date, default: Date.now },
})

CampaignSchema.index({ creatorId: 1, status: 1 })
CampaignSchema.index({ startDate: 1, endDate: 1 })

const Campaign = mongoose.model('Campaign', CampaignSchema)
module.exports = Campaign
