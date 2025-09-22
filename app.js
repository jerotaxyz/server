const express = require('express')
const cors = require('cors')
const winston = require('winston')
const { errorHandler } = require('./utils/errorHandler')

// Import routes
const userRoutes = require('./routes/users')
const campaignRoutes = require('./routes/campaigns')
const rewardRoutes = require('./routes/rewards')

// Configure Winston logger
winston.configure({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    defaultMeta: { service: 'jerota-backend' },
    transports: [
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
        new winston.transports.Console({
            format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
        }),
    ],
})

// Create Express app
const app = express()

// Middleware
app.use(
    cors({
        origin: process.env.FRONTEND_URL || '*',
        credentials: true,
    })
)

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Request logging middleware
app.use((req, res, next) => {
    winston.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        walletAddress: req.headers['x-wallet-address'],
    })
    next()
})

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Jerota Backend API is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
    })
})

// API routes
app.use('/api/users', userRoutes)
app.use('/api/campaigns', campaignRoutes)
app.use('/api/rewards', rewardRoutes)

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found',
    })
})

// Global error handler
app.use(errorHandler)

module.exports = app
