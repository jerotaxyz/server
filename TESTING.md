# Jerota Backend Testing Guide

This document provides comprehensive information about testing the Jerota backend API.

## Test Overview

The Jerota backend includes extensive test coverage with both integration and unit tests:

- **Integration Tests**: Test complete API workflows with database
- **Unit Tests**: Test individual services and utilities
- **Test Coverage**: Comprehensive coverage of all endpoints and services

## Test Structure

```
tests/
├── integration/           # API endpoint tests
│   ├── users.test.js     # User management tests
│   ├── campaigns.test.js # Campaign management tests
│   ├── rewards.test.js   # Reward system tests
│   └── health.test.js    # Health check tests
├── unit/                 # Service and utility tests
│   └── services/
│       ├── blockchain.test.js    # Blockchain service tests
│       └── verification.test.js  # Verification service tests
└── setup.js              # Test configuration
```

## Running Tests

### Prerequisites

```bash
# Install dependencies
npm install
```

### Test Commands

```bash
# Run all tests
npm test

# Run tests in watch mode (for development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run specific test file
npx jest tests/integration/users.test.js

# Run tests matching a pattern
npx jest --testNamePattern="should register"
```

### Quick Test Run

```bash
# Use the provided test runner
node run-tests.js
```

## Test Database

Tests use MongoDB Memory Server for isolated testing:
- Each test suite gets a fresh database
- No external MongoDB instance required
- Tests run in parallel safely
- Automatic cleanup after tests

## Integration Tests

### Users API Tests

**File**: `tests/integration/users.test.js`

Tests cover:
- ✅ User registration (creator and fan)
- ✅ Duplicate wallet address/username validation
- ✅ Input validation (wallet format, required fields)
- ✅ User profile retrieval
- ✅ User profile updates with authentication
- ✅ Authorization checks

**Example Test Cases**:
```javascript
// User registration
POST /api/users/register
- Valid creator registration
- Valid fan registration  
- Duplicate wallet address rejection
- Duplicate username rejection
- Invalid wallet address format
- Missing required fields

// User retrieval
GET /api/users/:walletAddress
- Get existing user details
- 404 for non-existent user
- Invalid wallet address format

// User updates
PUT /api/users/:walletAddress
- Update user profile
- Authentication required
- Authorization (own profile only)
- Username uniqueness validation
```

### Campaigns API Tests

**File**: `tests/integration/campaigns.test.js`

Tests cover:
- ✅ Campaign creation by creators
- ✅ Token validation against blockchain service
- ✅ Date range validation
- ✅ Campaign listing with pagination and filters
- ✅ Campaign updates by creator only
- ✅ Fan participation in campaigns
- ✅ Action verification and recording

**Example Test Cases**:
```javascript
// Campaign creation
POST /api/campaigns
- Valid campaign creation
- Creator role requirement
- Token address validation
- Date range validation
- Required fields validation

// Campaign retrieval
GET /api/campaigns/:id
- Get campaign details
- 404 for non-existent campaign

GET /api/campaigns
- List all campaigns
- Filter by status
- Pagination support

// Campaign updates
PUT /api/campaigns/:id
- Update campaign status/description
- Creator authorization required

// Campaign participation
POST /api/campaigns/:id/participate
- Fan participation recording
- Fan role requirement
- Active campaign requirement
- Valid action requirement
- Action verification
```

### Rewards API Tests

**File**: `tests/integration/rewards.test.js`

Tests cover:
- ✅ Reward claiming for verified actions
- ✅ User reward history retrieval
- ✅ Campaign reward statistics
- ✅ Participation validation
- ✅ Authentication and authorization

**Example Test Cases**:
```javascript
// Reward claiming
POST /api/rewards/claim
- Claim reward for verified action
- Fan role requirement
- Active campaign requirement
- Participation validation
- Action verification

// User rewards
GET /api/rewards/:walletAddress
- Get user reward history
- Pagination support
- Reward summary calculation
- 404 for non-existent user

// Campaign statistics
GET /api/rewards/campaign/:campaignId/stats
- Get campaign reward statistics
- Participant counts
- Token distribution
- Action counts
```

### Health Check Tests

**File**: `tests/integration/health.test.js`

Tests cover:
- ✅ Health endpoint functionality
- ✅ 404 handler for non-existent routes

## Unit Tests

### Blockchain Service Tests

**File**: `tests/unit/services/blockchain.test.js`

Tests cover:
- ✅ Token retrieval and caching
- ✅ Token validation
- ✅ Campaign token validation
- ✅ TVL calculation
- ✅ Error handling

### Verification Service Tests

**File**: `tests/unit/services/verification.test.js`

Tests cover:
- ✅ Platform detection from URLs
- ✅ Action verification for different platforms
- ✅ Proof hash generation
- ✅ Mock verification implementations

## Test Data

Tests use realistic test data:

```javascript
// Test Users
const creatorUser = {
  walletAddress: '0x1234567890123456789012345678901234567890',
  username: 'testcreator',
  role: 'creator',
  email: 'creator@example.com'
};

const fanUser = {
  walletAddress: '0x742d35Cc6634C0532925a3b8D4C0532925a3b8D4',
  username: 'testfan',
  role: 'fan',
  email: 'fan@example.com'
};

// Test Campaign
const testCampaign = {
  title: 'Test Music Campaign',
  description: 'Support my new album',
  budget: {
    amount: 1000,
    token: {
      address: '0x1234567890123456789012345678901234567890',
      name: 'USDC'
    }
  },
  rewardRules: [{
    action: 'stream',
    rewardAmount: 0.5,
    token: {
      address: '0x1234567890123456789012345678901234567890',
      name: 'USDC'
    },
    maxClaims: 10
  }],
  startDate: '2025-01-01T00:00:00Z',
  endDate: '2025-12-31T23:59:59Z',
  contentUrl: 'https://open.spotify.com/track/example'
};
```

## Test Coverage

The test suite provides comprehensive coverage:

- **Controllers**: All endpoint handlers tested
- **Services**: Blockchain and verification services
- **Middleware**: Authentication and validation
- **Models**: Database operations and validation
- **Error Handling**: Error scenarios and edge cases

### Coverage Report

```bash
# Generate coverage report
npm run test:coverage

# View HTML coverage report
open coverage/lcov-report/index.html
```

## Continuous Integration

Tests are designed to run in CI/CD environments:

- No external dependencies (uses in-memory database)
- Deterministic test results
- Proper cleanup and isolation
- Fast execution time

### CI Configuration Example

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm test
      - run: npm run test:coverage
```

## Debugging Tests

### Running Individual Tests

```bash
# Run specific test file
npx jest tests/integration/users.test.js

# Run specific test case
npx jest --testNamePattern="should register a new creator user"

# Run with verbose output
npx jest --verbose

# Run with debugging
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Common Issues

1. **Port conflicts**: Tests use different ports to avoid conflicts
2. **Database cleanup**: Each test gets a fresh database
3. **Async operations**: All async operations properly awaited
4. **Authentication**: Tests include proper authentication headers

## Test Best Practices

The test suite follows these best practices:

1. **Isolation**: Each test is independent
2. **Descriptive names**: Clear test descriptions
3. **Arrange-Act-Assert**: Clear test structure
4. **Edge cases**: Tests cover error scenarios
5. **Realistic data**: Uses realistic test data
6. **Fast execution**: Tests run quickly
7. **Deterministic**: Tests produce consistent results

## Adding New Tests

When adding new features, include tests:

1. **Integration tests** for new endpoints
2. **Unit tests** for new services/utilities
3. **Error case testing** for validation
4. **Authentication/authorization** testing

### Test Template

```javascript
describe('New Feature', () => {
  beforeEach(async () => {
    // Setup test data
  });

  describe('Happy Path', () => {
    it('should work correctly', async () => {
      // Arrange
      const testData = { /* test data */ };
      
      // Act
      const response = await request(app)
        .post('/api/new-endpoint')
        .send(testData)
        .expect(200);
      
      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject(expectedData);
    });
  });

  describe('Error Cases', () => {
    it('should handle validation errors', async () => {
      // Test validation scenarios
    });
    
    it('should handle authentication errors', async () => {
      // Test auth scenarios
    });
  });
});
```

## Performance Testing

While not included in the current suite, consider adding:

- Load testing with tools like Artillery
- Database performance testing
- Memory leak detection
- Response time monitoring

## Security Testing

Security considerations in tests:

- Input validation testing
- Authentication bypass attempts
- Authorization boundary testing
- SQL injection prevention (via Mongoose)
- XSS prevention testing

---

For questions about testing, refer to the main README.md or create an issue in the repository.