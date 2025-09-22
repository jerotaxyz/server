const { body, param, query, validationResult } = require('express-validator')
const { AppError } = require('../utils/errorHandler')

/**
 * Middleware to handle validation results
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map((error) => error.msg)
        return next(new AppError(errorMessages.join(', '), 400))
    }
    next()
}

/**
 * User registration validation
 */
const validateUserRegistration = [
    body('walletAddress')
        .matches(/^0x[a-fA-F0-9]{40}$/)
        .withMessage('Invalid wallet address format'),
    body('username')
        .isLength({ min: 3, max: 30 })
        .withMessage('Username must be between 3 and 30 characters')
        .isAlphanumeric()
        .withMessage('Username must contain only letters and numbers'),
    body('role').isIn(['creator', 'fan']).withMessage('Role must be either creator or fan'),
    body('email').optional().isEmail().withMessage('Please provide a valid email'),
    body('twitter').optional().isString().trim(),
    body('instagram').optional().isString().trim(),
    handleValidationErrors,
]

/**
 * Campaign creation validation
 */
const validateCampaignCreation = [
    body('title')
        .isLength({ min: 3, max: 100 })
        .withMessage('Title must be between 3 and 100 characters'),
    body('description')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('Description must not exceed 1000 characters'),
    body('budget.amount')
        .isFloat({ min: 0 })
        .withMessage('Budget amount must be a positive number'),
    body('budget.token.address')
        .matches(/^0x[a-fA-F0-9]{40}$/)
        .withMessage('Invalid token address format'),
    body('budget.token.name').isString().notEmpty().withMessage('Token name is required'),
    body('rewardRules').isArray({ min: 1 }).withMessage('At least one reward rule is required'),
    body('startDate').isISO8601().withMessage('Invalid start date format'),
    body('endDate').isISO8601().withMessage('Invalid end date format'),
    body('contentUrl').isURL().withMessage('Content URL must be a valid URL'),
    handleValidationErrors,
]

/**
 * Campaign participation validation
 */
const validateCampaignParticipation = [
    body('action')
        .isIn(['stream', 'share', 'comment', 'like', 'follow'])
        .withMessage('Invalid action type'),
    body('proof').isString().notEmpty().withMessage('Proof is required'),
    handleValidationErrors,
]

/**
 * Reward claim validation
 */
const validateRewardClaim = [
    body('campaignId').isMongoId().withMessage('Invalid campaign ID'),
    body('action')
        .isIn(['stream', 'share', 'comment', 'like', 'follow'])
        .withMessage('Invalid action type'),
    body('proof').isString().notEmpty().withMessage('Proof is required'),
    handleValidationErrors,
]

/**
 * Wallet address parameter validation
 */
const validateWalletAddress = [
    param('walletAddress')
        .matches(/^0x[a-fA-F0-9]{40}$/)
        .withMessage('Invalid wallet address format'),
    handleValidationErrors,
]

/**
 * MongoDB ObjectId parameter validation
 */
const validateObjectId = [
    param('id').isMongoId().withMessage('Invalid ID format'),
    handleValidationErrors,
]

/**
 * Campaign ID parameter validation
 */
const validateCampaignId = [
    param('campaignId').isMongoId().withMessage('Invalid campaign ID format'),
    handleValidationErrors,
]

/**
 * Pagination query validation
 */
const validatePagination = [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    handleValidationErrors,
]

module.exports = {
    validateUserRegistration,
    validateCampaignCreation,
    validateCampaignParticipation,
    validateRewardClaim,
    validateWalletAddress,
    validateObjectId,
    validateCampaignId,
    validatePagination,
    handleValidationErrors,
}
