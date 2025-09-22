const mongoose = require('mongoose')
const winston = require('winston')

/**
 * Connect to MongoDB with retry logic
 */
const connectDB = async () => {
    const maxRetries = 5
    let retries = 0

    while (retries < maxRetries) {
        try {
            const conn = await mongoose.connect(process.env.MONGODB_URI)

            winston.info(`MongoDB Connected: ${conn.connection.host}`)
            return
        } catch (error) {
            retries++
            winston.error(`MongoDB connection attempt ${retries} failed: ${error.message}`)

            if (retries === maxRetries) {
                winston.error('Max retries reached. Exiting...')
                process.exit(1)
            }

            // Wait before retrying (exponential backoff)
            await new Promise((resolve) => setTimeout(resolve, Math.pow(2, retries) * 1000))
        }
    }
}

module.exports = connectDB
