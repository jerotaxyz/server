const express = require('express')
const router = express.Router()
const {
    createCampaign,
    getCampaignById,
    getCampaigns,
    updateCampaign,
    participateInCampaign,
} = require('../controllers/campaignController')
const { authenticate, authorize } = require('../middleware/auth')
const {
    validateCampaignCreation,
    validateCampaignParticipation,
    validateObjectId,
    validatePagination,
} = require('../middleware/validate')

/**
 * @route POST /api/campaigns
 * @desc Create a new campaign
 * @access Private (creators only)
 */
router.post('/', authenticate, authorize('creator'), validateCampaignCreation, createCampaign)

/**
 * @route GET /api/campaigns/:id
 * @desc Get campaign details by ID
 * @access Public
 */
router.get('/:id', validateObjectId, getCampaignById)

/**
 * @route GET /api/campaigns
 * @desc List campaigns with filtering and pagination
 * @access Public
 */
router.get('/', validatePagination, getCampaigns)

/**
 * @route PUT /api/campaigns/:id
 * @desc Update campaign (creator only)
 * @access Private (campaign creator only)
 */
router.put('/:id', authenticate, authorize('creator'), validateObjectId, updateCampaign)

/**
 * @route POST /api/campaigns/:id/participate
 * @desc Record fan participation in campaign
 * @access Private (fans only)
 */
router.post(
    '/:id/participate',
    authenticate,
    authorize('fan'),
    validateObjectId,
    validateCampaignParticipation,
    participateInCampaign
)

module.exports = router
