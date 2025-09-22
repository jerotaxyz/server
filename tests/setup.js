const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const winston = require('winston');

let mongoServer;

beforeAll(async () => {
  // Configure Winston for testing (suppress logs)
  winston.configure({
    level: 'error', // Only show errors during testing
    format: winston.format.simple(),
    transports: [
      new winston.transports.Console({
        silent: true // Completely silence console output during tests
      })
    ]
  });

  // Start in-memory MongoDB instance
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Connect to the in-memory database
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  // Clean up
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  // Clear all collections before each test
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});