const express = require('express')
const router = express.Router()
const {
    claimReward,
    getUserRewards,
    getCampaignRewardStats,
} = require('../controllers/rewardController')
const { authenticate, authorize } = require('../middleware/auth')
const {
    validateRewardClaim,
    validateWalletAddress,
    validateObjectId,
    validateCampaignId,
    validatePagination,
} = require('../middleware/validate')

/**
 * @route POST /api/rewards/claim
 * @desc Claim a reward for a verified action
 * @access Private (fans only)
 */
router.post('/claim', authenticate, authorize('fan'), validateRewardClaim, claimReward)

/**
 * @route GET /api/rewards/:walletAddress
 * @desc Get rewards earned by a user
 * @access Public
 */
router.get('/:walletAddress', validateWalletAddress, validatePagination, getUserRewards)

/**
 * @route GET /api/rewards/campaign/:campaignId/stats
 * @desc Get reward statistics for a campaign
 * @access Public
 */
router.get('/campaign/:campaignId/stats', validateCampaignId, getCampaignRewardStats)

module.exports = router
