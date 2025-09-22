const { Campaign, User } = require('../models')
const { AppError } = require('../utils/errorHandler')
const verificationService = require('../services/verification')
const winston = require('winston')

/**
 * Claim a reward for a verified action
 * @route POST /api/rewards/claim
 */
const claimReward = async (req, res, next) => {
    try {
        const { campaignId, action, proof } = req.body

        // Validate that user is a fan
        if (req.user.role !== 'fan') {
            return next(new AppError('Only fans can claim rewards', 403))
        }

        const campaign = await Campaign.findById(campaignId)
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

        // Find reward rule for this action
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

        // Check if user has already participated and performed this action
        const participant = campaign.participants.find(
            (p) => p.userId.toString() === req.user._id.toString()
        )

        if (!participant) {
            return next(new AppError('User has not participated in this campaign', 400))
        }

        // Check if this specific action has been verified
        const actionExists = participant.actions.some(
            (a) => a.actionType === action && a.proof === verification.proofHash
        )

        if (!actionExists) {
            return next(new AppError('Action not found or not verified', 400))
        }

        // Check if reward has already been claimed for this action
        const existingReward = req.user.rewardsEarned.find(
            (reward) =>
                reward.campaignId.toString() === campaignId &&
                reward.token.address === rewardRule.token.address &&
                reward.amount === rewardRule.rewardAmount
        )

        // For simplicity, we'll allow multiple claims if within maxClaims limit
        if (rewardRule.maxClaims) {
            const claimedCount = req.user.rewardsEarned.filter(
                (reward) =>
                    reward.campaignId.toString() === campaignId &&
                    reward.token.address === rewardRule.token.address
            ).length

            if (claimedCount >= rewardRule.maxClaims) {
                return next(
                    new AppError(
                        `Maximum rewards (${rewardRule.maxClaims}) already claimed for this action`,
                        400
                    )
                )
            }
        }

        // Add reward to user's earned rewards
        const reward = {
            campaignId: campaign._id,
            amount: rewardRule.rewardAmount,
            token: {
                address: rewardRule.token.address,
                name: rewardRule.token.name,
            },
            claimedAt: new Date(),
        }

        await User.findByIdAndUpdate(req.user._id, { $push: { rewardsEarned: reward } })

        winston.info(
            `Reward claimed: ${req.user.username} earned ${rewardRule.rewardAmount} ${rewardRule.token.name} from campaign ${campaign.title}`
        )

        res.json({
            success: true,
            data: {
                message: 'Reward claimed successfully',
                reward: {
                    campaignId: campaign._id,
                    campaignTitle: campaign.title,
                    action,
                    amount: rewardRule.rewardAmount,
                    token: rewardRule.token,
                    claimedAt: reward.claimedAt,
                },
            },
        })
    } catch (error) {
        next(error)
    }
}

/**
 * Get rewards earned by a user
 * @route GET /api/rewards/:walletAddress
 */
const getUserRewards = async (req, res, next) => {
    try {
        const { walletAddress } = req.params
        const { page = 1, limit = 10 } = req.query

        const user = await User.findOne({ walletAddress: walletAddress.toLowerCase() }).populate({
            path: 'rewardsEarned.campaignId',
            select: 'title creatorId',
            populate: {
                path: 'creatorId',
                select: 'username',
            },
        })

        if (!user) {
            return next(new AppError('User not found', 404))
        }

        // Calculate pagination for rewards
        const skip = (parseInt(page) - 1) * parseInt(limit)
        const totalRewards = user.rewardsEarned.length
        const paginatedRewards = user.rewardsEarned
            .sort((a, b) => new Date(b.claimedAt) - new Date(a.claimedAt))
            .slice(skip, skip + parseInt(limit))

        // Calculate total rewards by token
        const rewardsSummary = user.rewardsEarned.reduce((acc, reward) => {
            const tokenKey = `${reward.token.address}-${reward.token.name}`
            if (!acc[tokenKey]) {
                acc[tokenKey] = {
                    token: reward.token,
                    totalAmount: 0,
                    claimCount: 0,
                }
            }
            acc[tokenKey].totalAmount += reward.amount
            acc[tokenKey].claimCount += 1
            return acc
        }, {})

        res.json({
            success: true,
            data: {
                user: {
                    walletAddress: user.walletAddress,
                    username: user.username,
                },
                rewards: paginatedRewards,
                summary: Object.values(rewardsSummary),
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: totalRewards,
                    pages: Math.ceil(totalRewards / parseInt(limit)),
                },
            },
        })
    } catch (error) {
        next(error)
    }
}

/**
 * Get reward statistics for a campaign
 * @route GET /api/rewards/campaign/:campaignId/stats
 */
const getCampaignRewardStats = async (req, res, next) => {
    try {
        const { campaignId } = req.params

        const campaign = await Campaign.findById(campaignId)
        if (!campaign) {
            return next(new AppError('Campaign not found', 404))
        }

        // Get all users who earned rewards from this campaign
        const users = await User.find(
            {
                'rewardsEarned.campaignId': campaignId,
            },
            {
                username: 1,
                walletAddress: 1,
                rewardsEarned: 1,
            }
        )

        // Calculate statistics
        let totalRewardsClaimed = 0
        let totalParticipants = users.length
        const rewardsByToken = {}
        const rewardsByAction = {}

        users.forEach((user) => {
            user.rewardsEarned.forEach((reward) => {
                if (reward.campaignId.toString() === campaignId) {
                    totalRewardsClaimed++

                    // Group by token
                    const tokenKey = reward.token.address
                    if (!rewardsByToken[tokenKey]) {
                        rewardsByToken[tokenKey] = {
                            token: reward.token,
                            totalAmount: 0,
                            claimCount: 0,
                        }
                    }
                    rewardsByToken[tokenKey].totalAmount += reward.amount
                    rewardsByToken[tokenKey].claimCount++
                }
            })
        })

        // Calculate rewards by action from campaign participants
        campaign.participants.forEach((participant) => {
            participant.actions.forEach((action) => {
                if (!rewardsByAction[action.actionType]) {
                    rewardsByAction[action.actionType] = 0
                }
                rewardsByAction[action.actionType]++
            })
        })

        res.json({
            success: true,
            data: {
                campaignId,
                campaignTitle: campaign.title,
                totalParticipants,
                totalRewardsClaimed,
                rewardsByToken: Object.values(rewardsByToken),
                actionCounts: rewardsByAction,
                participantCount: campaign.participants.length,
            },
        })
    } catch (error) {
        next(error)
    }
}

module.exports = {
    claimReward,
    getUserRewards,
    getCampaignRewardStats,
}
