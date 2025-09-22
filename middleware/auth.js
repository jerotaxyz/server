const { AppError } = require('../utils/errorHandler')
const { User } = require('../models')

/**
 * Authentication middleware - validates wallet address and retrieves user
 */
const authenticate = async (req, res, next) => {
    try {
        const walletAddress = req.headers['x-wallet-address']

        if (!walletAddress) {
            return next(new AppError('Wallet address is required', 401))
        }

        // Validate wallet address format
        if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
            return next(new AppError('Invalid wallet address format', 400))
        }

        // Find user by wallet address
        const user = await User.findOne({ walletAddress: walletAddress.toLowerCase() })

        if (!user) {
            return next(new AppError('User not found', 404))
        }

        // Add user to request object
        req.user = user
        next()
    } catch (error) {
        next(error)
    }
}

/**
 * Authorization middleware - checks if user has required role
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new AppError('Authentication required', 401))
        }

        if (!roles.includes(req.user.role)) {
            return next(
                new AppError(`Role ${req.user.role} is not authorized to access this resource`, 403)
            )
        }

        next()
    }
}

module.exports = { authenticate, authorize }
