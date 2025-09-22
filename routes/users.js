const express = require('express')
const router = express.Router()
const { registerUser, getUserByWallet, updateUser } = require('../controllers/userController')
const { authenticate } = require('../middleware/auth')
const { validateUserRegistration, validateWalletAddress } = require('../middleware/validate')

/**
 * @swagger
 * /api/users/register:
 *   post:
 *     summary: Register a new user
 *     description: Register a new creator or fan user with wallet address
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - walletAddress
 *               - username
 *               - role
 *             properties:
 *               walletAddress:
 *                 type: string
 *                 pattern: '^0x[a-fA-F0-9]{40}$'
 *                 example: '0x1234567890123456789012345678901234567890'
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 30
 *                 example: 'testcreator'
 *               role:
 *                 type: string
 *                 enum: [creator, fan]
 *                 example: 'creator'
 *               email:
 *                 type: string
 *                 format: email
 *                 example: 'creator@example.com'
 *               twitter:
 *                 type: string
 *                 example: '@testcreator'
 *               instagram:
 *                 type: string
 *                 example: 'testcreator'
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         user:
 *                           $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error or duplicate user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/register', validateUserRegistration, registerUser)

/**
 * @swagger
 * /api/users/{walletAddress}:
 *   get:
 *     summary: Get user details by wallet address
 *     description: Retrieve user information including campaigns and rewards
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: walletAddress
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^0x[a-fA-F0-9]{40}$'
 *         description: Ethereum wallet address
 *         example: '0x1234567890123456789012345678901234567890'
 *     responses:
 *       200:
 *         description: User details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         user:
 *                           $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       400:
 *         description: Invalid wallet address format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:walletAddress', validateWalletAddress, getUserByWallet)

/**
 * @swagger
 * /api/users/{walletAddress}:
 *   put:
 *     summary: Update user details
 *     description: Update user profile information (users can only update their own profile)
 *     tags: [Users]
 *     security:
 *       - WalletAuth: []
 *     parameters:
 *       - in: path
 *         name: walletAddress
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^0x[a-fA-F0-9]{40}$'
 *         description: Ethereum wallet address
 *         example: '0x1234567890123456789012345678901234567890'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 30
 *                 example: 'updatedcreator'
 *               email:
 *                 type: string
 *                 format: email
 *                 example: 'updated@example.com'
 *               twitter:
 *                 type: string
 *                 example: '@updatedcreator'
 *               instagram:
 *                 type: string
 *                 example: 'updatedcreator'
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         user:
 *                           $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error or username already taken
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Not authorized to update this profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:walletAddress', validateWalletAddress, authenticate, updateUser)

module.exports = router
