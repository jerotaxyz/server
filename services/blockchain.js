const { ethers } = require('ethers')
const winston = require('winston')

/**
 * Blockchain service for interacting with Lisk L2 smart contracts
 */
class BlockchainService {
    constructor() {
        this.provider = new ethers.JsonRpcProvider(process.env.LISK_L2_RPC_URL)
        this.allowedTokensCache = null
        this.cacheExpiry = null
        this.CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
    }

    /**
     * Mock function to simulate getAllowedTokens() smart contract call
     * In production, this would interact with the actual smart contract
     * @returns {Array} Array of allowed tokens with address and name
     */
    async getAllowedTokens() {
        try {
            // Check cache first
            if (this.allowedTokensCache && this.cacheExpiry && Date.now() < this.cacheExpiry) {
                return this.allowedTokensCache
            }

            // Mock allowed tokens - in production, this would be a smart contract call
            const allowedTokens = [
                {
                    address: '0x1234567890123456789012345678901234567890',
                    name: 'USDC',
                },
                {
                    address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
                    name: 'USDT',
                },
                {
                    address: '0x6033F7f88332B8db6ad452b7C6d5bb643990ae3f',
                    name: 'LSK',
                },
                {
                    address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
                    name: 'UNI',
                },
            ]

            // Cache the result
            this.allowedTokensCache = allowedTokens
            this.cacheExpiry = Date.now() + this.CACHE_DURATION

            winston.info('Retrieved allowed tokens from smart contract')
            return allowedTokens
        } catch (error) {
            winston.error('Error fetching allowed tokens:', error)
            throw new Error('Failed to fetch allowed tokens from smart contract')
        }
    }

    /**
     * Validate if a token address is allowed
     * @param {string} tokenAddress - Token contract address
     * @returns {boolean} True if token is allowed
     */
    async isTokenAllowed(tokenAddress) {
        try {
            const allowedTokens = await this.getAllowedTokens()
            return allowedTokens.some(
                (token) => token.address.toLowerCase() === tokenAddress.toLowerCase()
            )
        } catch (error) {
            winston.error('Error validating token:', error)
            return false
        }
    }

    /**
     * Get token info by address
     * @param {string} tokenAddress - Token contract address
     * @returns {Object|null} Token info or null if not found
     */
    async getTokenInfo(tokenAddress) {
        try {
            const allowedTokens = await this.getAllowedTokens()
            return (
                allowedTokens.find(
                    (token) => token.address.toLowerCase() === tokenAddress.toLowerCase()
                ) || null
            )
        } catch (error) {
            winston.error('Error getting token info:', error)
            return null
        }
    }

    /**
     * Mock function to get TVL for a campaign
     * In production, this would query the smart contract for locked funds
     * @param {string} campaignId - Campaign identifier
     * @returns {number} TVL in USD
     */
    async getCampaignTVL(campaignId) {
        try {
            // Mock TVL calculation - in production, query smart contract
            // This would convert locked token amounts to USD equivalent
            const mockTVL = Math.floor(Math.random() * 10000) + 1000 // Random TVL between 1000-11000

            winston.info(`Retrieved TVL for campaign ${campaignId}: $${mockTVL}`)
            return mockTVL
        } catch (error) {
            winston.error('Error fetching campaign TVL:', error)
            return 0
        }
    }

    /**
     * Validate token addresses in campaign data
     * @param {Object} campaignData - Campaign data with budget and reward rules
     * @returns {boolean} True if all tokens are valid
     */
    async validateCampaignTokens(campaignData) {
        try {
            // Validate budget token
            const budgetTokenValid = await this.isTokenAllowed(campaignData.budget.token.address)
            if (!budgetTokenValid) {
                throw new Error(`Budget token ${campaignData.budget.token.address} is not allowed`)
            }

            // Validate reward rule tokens
            for (const rule of campaignData.rewardRules) {
                const rewardTokenValid = await this.isTokenAllowed(rule.token.address)
                if (!rewardTokenValid) {
                    throw new Error(`Reward token ${rule.token.address} is not allowed`)
                }
            }

            return true
        } catch (error) {
            winston.error('Token validation failed:', error)
            throw error
        }
    }
}

module.exports = new BlockchainService()
