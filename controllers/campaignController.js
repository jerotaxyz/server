const { Campaign, User } = require('../models')
const { AppError } = require('../utils/errorHandler')
const blockchainService = require('../services/blockchain')
const verificationService = require('../services/verification')
const winston = require('winston')

/**
 * Create a new campaign
 * @route POST /api/campaigns
 */
const createCampaign = async (req, res, next) => {
    try {
        const { title, description, budget, rewardRules, startDate, endDate, contentUrl } = req.body

        // Validate that user is a creator
        if (req.user.role !== 'creator') {
            return next(new AppError('Only creators can create campaigns', 403))
        }

        // Validate dates
        const start = new Date(startDate)
        const end = new Date(endDate)
        if (start >= end) {
            return next(new AppError('End date must be after start date', 400))
        }

        // Validate tokens with blockchain service
        const campaignData = { budget, rewardRules }
        await blockchainService.validateCampaignTokens(campaignData)

        // Create campaign
        const campaign = await Campaign.create({
            creatorId: req.user._id,
            title,
            description,
            budget,
            rewardRules,
            startDate: start,
            endDate: end,
            contentUrl,
        })

        // Add campaign to user's created campaigns
        await User.findByIdAndUpdate(req.user._id, { $push: { campaignsCreated: campaign._id } })

        winston.info(`New campaign created: ${title} by ${req.user.username}`)

        res.status(201).json({
            success: true,
            data: { campaign },
        })
    } catch (error) {
        next(error)
    }
}

/**
 * Get campaign details by ID
 * @route GET /api/campaigns/:id
 */
const getCampaignById = async (req, res, next) => {
    try {
        const { id } = req.params

        const campaign = await Campaign.findById(id)
            .populate('creatorId', 'username walletAddress')
            .populate('participants.userId', 'username walletAddress')

        if (!campaign) {
            return next(new AppError('Campaign not found', 404))
        }

        // Get TVL from blockchain service
        const tvl = await blockchainService.getCampaignTVL(id)
        campaign.totalTVL = tvl
        await campaign.save()

        res.json({
            success: true,
            data: { campaign },
        })
    } catch (error) {
        next(error)
    }
}

/**
 * List campaigns with filtering and pagination
 * @route GET /api/campaigns
 */
const getCampaigns = async (req, res, next) => {
    try {
        const { status, creator, startDate, endDate, page = 1, limit = 10 } = req.query

        // Build filter object
        const filter = {}

        if (status) {
            filter.status = status
        }

        if (creator) {
            const creatorUser = await User.findOne({ username: creator })
            if (creatorUser) {
                filter.creatorId = creatorUser._id
            }
        }

        if (startDate || endDate) {
            filter.startDate = {}
            if (startDate) filter.startDate.$gte = new Date(startDate)
            if (endDate) filter.startDate.$lte = new Date(endDate)
        }

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit)

        // Get campaigns with pagination
        const campaigns = await Campaign.find(filter)
            .populate('creatorId', 'username walletAddress')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))

        // Get total count for pagination
        const total = await Campaign.countDocuments(filter)

        res.json({
            success: true,
            data: {
                campaigns,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit)),
                },
            },
        })
    } catch (error) {
        next(error)
    }
}

/**
 * Update campaign (creator only)
 * @route PUT /api/campaigns/:id
 */
const updateCampaign = async (req, res, next) => {
    try {
        const { id } = req.params
        const { status, description } = req.body

        const campaign = await Campaign.findById(id)
        if (!campaign) {
            return next(new AppError('Campaign not found', 404))
        }

        // Check if user is the creator
        if (campaign.creatorId.toString() !== req.user._id.toString()) {
            return next(new AppError('Only campaign creator can update campaign', 403))
        }

        // Update allowed fields
        const updateData = {}
        if (status) updateData.status = status
        if (description !== undefined) updateData.description = description

        const updatedCampaign = await Campaign.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true,
        }).populate('creatorId', 'username walletAddress')

        winston.info(`Campaign updated: ${updatedCampaign.title} by ${req.user.username}`)

        res.json({
            success: true,
            data: { campaign: updatedCampaign },
        })
    } catch (error) {
        next(error)
    }
}

/**
 * Record fan participation in campaign
 * @route POST /api/campaigns/:id/participate
 */
const participateInCampaign = async (req, res, next) => {
    try {
        const { id } = req.params
        const { action, proof } = req.body

        // Validate that user is a fan
        if (req.user.role !== 'fan') {
            return next(new AppError('Only fans can participate in campaigns', 403))
        }

        const campaign = await Campaign.findById(id)
        if (!campaign) {
            return next(new AppError('Campaign not found', 404))
        }

        // Check if campaign is active
        if (campaign.status !== 'active') {
            return next(new AppError('Campaign is not active', 400))
        }

        // Check if campaign is within date range
        const now = new Date()
        if (now < campaign.startDate || now > campaign.endDate) {
            return next(new AppError('Campaign is not within active date range', 400))
        }

        // Check if action is valid for this campaign
        const rewardRule = campaign.rewardRules.find((rule) => rule.action === action)
        if (!rewardRule) {
            return next(new AppError(`Action '${action}' is not rewarded in this campaign`, 400))
        }

        // Verify the action
        const verification = await verificationService.verifyAction(
            action,
            campaign.contentUrl,
            proof,
            req.user.walletAddress
        )

        if (!verification.verified) {
            return next(new AppError('Action verification failed', 400))
        }

        // Check if user already participated
        let participant = campaign.participants.find(
            (p) => p.userId.toString() === req.user._id.toString()
        )

        if (!participant) {
            // Add new participant
            participant = {
                userId: req.user._id,
                actions: [],
            }
            campaign.participants.push(participant)

            // Add campaign to user's participated campaigns
            await User.findByIdAndUpdate(req.user._id, {
                $addToSet: { campaignsParticipated: campaign._id },
            })
        }

        // Check max claims limit
        if (rewardRule.maxClaims) {
            const actionCount = participant.actions.filter((a) => a.actionType === action).length
            if (actionCount >= rewardRule.maxClaims) {
                return next(
                    new AppError(
                        `Maximum claims (${rewardRule.maxClaims}) reached for action '${action}'`,
                        400
                    )
                )
            }
        }

        // Add action to participant
        participant.actions.push({
            actionType: action,
            verifiedAt: new Date(),
            proof: verification.proofHash,
        })

        await campaign.save()

        winston.info(
            `User ${req.user.username} participated in campaign ${campaign.title} with action ${action}`
        )

        res.json({
            success: true,
            data: {
                message: 'Participation recorded successfully',
                verification,
                rewardEligible: true,
                rewardAmount: rewardRule.rewardAmount,
                rewardToken: rewardRule.token,
            },
        })
    } catch (error) {
        next(error)
    }
}

module.exports = {
    createCampaign,
    getCampaignById,
    getCampaigns,
    updateCampaign,
    participateInCampaign,
}
