require('dotenv').config()
const app = require('./app')
const connectDB = require('./config/db')
const winston = require('winston')

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    winston.error('Uncaught Exception:', err)
    process.exit(1)
})

// Connect to MongoDB
connectDB()

const PORT = process.env.PORT || 3000

const server = app.listen(PORT, () => {
    winston.info(`Jerota Backend Server running on port ${PORT}`)
    winston.info(`Environment: ${process.env.NODE_ENV || 'development'}`)
})

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    winston.error('Unhandled Rejection:', err)
    server.close(() => {
        process.exit(1)
    })
})

// Graceful shutdown
process.on('SIGTERM', () => {
    winston.info('SIGTERM received. Shutting down gracefully...')
    server.close(() => {
        winston.info('Process terminated')
    })
})

process.on('SIGINT', () => {
    winston.info('SIGINT received. Shutting down gracefully...')
    server.close(() => {
        winston.info('Process terminated')
    })
})
