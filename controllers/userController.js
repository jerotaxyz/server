const { User } = require('../models')
const { AppError } = require('../utils/errorHandler')
const winston = require('winston')

/**
 * Register a new user
 * @route POST /api/users/register
 */
const registerUser = async (req, res, next) => {
    try {
        const { walletAddress, username, role, email, twitter, instagram } = req.body

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ walletAddress: walletAddress.toLowerCase() }, { username }],
        })

        if (existingUser) {
            if (existingUser.walletAddress === walletAddress.toLowerCase()) {
                return next(new AppError('Wallet address already registered', 400))
            }
            if (existingUser.username === username) {
                return next(new AppError('Username already taken', 400))
            }
        }

        // Create new user
        const user = await User.create({
            walletAddress: walletAddress.toLowerCase(),
            username,
            role,
            email,
            twitter,
            instagram,
        })

        winston.info(`New user registered: ${username} (${walletAddress})`)

        res.status(201).json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    walletAddress: user.walletAddress,
                    username: user.username,
                    role: user.role,
                    email: user.email,
                    twitter: user.twitter,
                    instagram: user.instagram,
                    createdAt: user.createdAt,
                },
            },
        })
    } catch (error) {
        next(error)
    }
}

/**
 * Get user details by wallet address
 * @route GET /api/users/:walletAddress
 */
const getUserByWallet = async (req, res, next) => {
    try {
        const { walletAddress } = req.params

        const user = await User.findOne({ walletAddress: walletAddress.toLowerCase() })
            .populate('campaignsCreated', 'title status startDate endDate totalTVL')
            .populate('campaignsParticipated', 'title status startDate endDate')
            .populate('rewardsEarned.campaignId', 'title')

        if (!user) {
            return next(new AppError('User not found', 404))
        }

        res.json({
            success: true,
            data: { user },
        })
    } catch (error) {
        next(error)
    }
}

/**
 * Update user details
 * @route PUT /api/users/:walletAddress
 */
const updateUser = async (req, res, next) => {
    try {
        const { walletAddress } = req.params
        const { username, email, twitter, instagram } = req.body

        // Check if user exists
        const user = await User.findOne({ walletAddress: walletAddress.toLowerCase() })
        if (!user) {
            return next(new AppError('User not found', 404))
        }

        // Check authorization - users can only update their own profile
        if (req.user.walletAddress !== walletAddress.toLowerCase()) {
            return next(new AppError('Not authorized to update this profile', 403))
        }

        // Check if new username is already taken (if username is being changed)
        if (username && username !== user.username) {
            const existingUser = await User.findOne({ username })
            if (existingUser) {
                return next(new AppError('Username already taken', 400))
            }
        }

        // Update user
        const updatedUser = await User.findOneAndUpdate(
            { walletAddress: walletAddress.toLowerCase() },
            {
                ...(username && { username }),
                ...(email !== undefined && { email }),
                ...(twitter !== undefined && { twitter }),
                ...(instagram !== undefined && { instagram }),
            },
            { new: true, runValidators: true }
        )

        winston.info(`User updated: ${updatedUser.username} (${walletAddress})`)

        res.json({
            success: true,
            data: {
                user: {
                    id: updatedUser._id,
                    walletAddress: updatedUser.walletAddress,
                    username: updatedUser.username,
                    role: updatedUser.role,
                    email: updatedUser.email,
                    twitter: updatedUser.twitter,
                    instagram: updatedUser.instagram,
                    createdAt: updatedUser.createdAt,
                },
            },
        })
    } catch (error) {
        next(error)
    }
}

module.exports = {
    registerUser,
    getUserByWallet,
    updateUser,
}
