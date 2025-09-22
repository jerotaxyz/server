const express = require('express')
const router = express.Router()
const { registerUser, getUserByWallet, updateUser } = require('../controllers/userController')
const { authenticate } = require('../middleware/auth')
const { validateUserRegistration, validateWalletAddress } = require('../middleware/validate')

/**
 * @route POST /api/users/register
 * @desc Register a new user
 * @access Public
 */
router.post('/register', validateUserRegistration, registerUser)

/**
 * @route GET /api/users/:walletAddress
 * @desc Get user details by wallet address
 * @access Public
 */
router.get('/:walletAddress', validateWalletAddress, getUserByWallet)

/**
 * @route PUT /api/users/:walletAddress
 * @desc Update user details
 * @access Private (user can only update their own profile)
 */
router.put('/:walletAddress', validateWalletAddress, authenticate, updateUser)

module.exports = router
