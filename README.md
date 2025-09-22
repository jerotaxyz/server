# Jerota Backend

A complete backend API for the Jerota platform - a creator campaign and fan rewards system built with Express.js and MongoDB.

## Overview

Jerota enables creators (musicians, YouTubers, etc.) to launch campaigns to fund content, while fans earn token rewards (USDC, USDT, LSK, etc.) for actions like streaming, sharing, commenting, liking, or following. Campaign budgets are locked on-chain (Lisk L2), but the backend handles offchain data management, action verification, and smart contract integration.

## Features

- **User Management**: Creator and fan registration with wallet-based authentication
- **Campaign Management**: Create, update, and manage creator campaigns with reward rules
- **Action Verification**: Verify fan actions on external platforms (Spotify, YouTube, Twitter)
- **Reward System**: Token-based rewards with blockchain integration
- **Smart Contract Integration**: Validate tokens against Lisk L2 smart contracts
- **RESTful API**: Complete API with validation, error handling, and pagination

## Tech Stack

- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Blockchain**: Ethers.js for Lisk L2 integration
- **Validation**: Express-validator
- **Logging**: Winston
- **Environment**: Node.js (LTS)

## Project Structure

```
/jerota-backend
├── /config
│   └── db.js              # MongoDB connection setup
├── /models
│   ├── User.js            # User schema
│   ├── Campaign.js        # Campaign schema
│   └── index.js           # Model exports
├── /routes
│   ├── users.js           # User endpoints
│   ├── campaigns.js       # Campaign endpoints
│   └── rewards.js         # Reward endpoints
├── /controllers
│   ├── userController.js
│   ├── campaignController.js
│   └── rewardController.js
├── /middleware
│   ├── auth.js            # Authentication middleware
│   └── validate.js        # Input validation
├── /services
│   ├── blockchain.js      # Smart contract interaction
│   └── verification.js    # External API verification
├── /utils
│   └── errorHandler.js    # Centralized error handling
├── app.js                 # Express app setup
├── server.js              # Server entry point
├── package.json
├── .env                   # Environment variables
└── README.md
```

## Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd jerota-backend
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**
   Copy `.env` file and configure:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/jerota
LISK_L2_RPC_URL=https://rpc.api.lisk.com
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
YOUTUBE_API_KEY=your_youtube_api_key
TWITTER_BEARER_TOKEN=your_twitter_bearer_token
NODE_ENV=development
```

4. **Start MongoDB**
   Make sure MongoDB is running locally or update `MONGODB_URI` for remote connection.

5. **Run the application**

```bash
# Development
npm run dev

# Production
npm start
```

## API Documentation

### Base URL

```
http://localhost:3000/api
```

### Authentication

Include wallet address in request headers:

```
x-wallet-address: 0x1234567890123456789012345678901234567890
```

### Users API

#### Register User

```http
POST /api/users/register
Content-Type: application/json

{
  "walletAddress": "0x1234567890123456789012345678901234567890",
  "username": "creator123",
  "role": "creator",
  "email": "creator@example.com",
  "twitter": "@creator123",
  "instagram": "creator123"
}
```

#### Get User Details

```http
GET /api/users/0x1234567890123456789012345678901234567890
```

#### Update User

```http
PUT /api/users/0x1234567890123456789012345678901234567890
x-wallet-address: 0x1234567890123456789012345678901234567890
Content-Type: application/json

{
  "username": "newusername",
  "email": "newemail@example.com"
}
```

### Campaigns API

#### Create Campaign

```http
POST /api/campaigns
x-wallet-address: 0x1234567890123456789012345678901234567890
Content-Type: application/json

{
  "title": "My Music Campaign",
  "description": "Support my new album",
  "budget": {
    "amount": 1000,
    "token": {
      "address": "0xa0b86991c431e803e5f6d5024d9650441c8c5c044",
      "name": "USDC"
    }
  },
  "rewardRules": [
    {
      "action": "stream",
      "rewardAmount": 0.5,
      "token": {
        "address": "0xa0b86991c431e803e5f6d5024d9650441c8c5c044",
        "name": "USDC"
      },
      "maxClaims": 10
    }
  ],
  "startDate": "2024-01-01T00:00:00Z",
  "endDate": "2024-12-31T23:59:59Z",
  "contentUrl": "https://open.spotify.com/track/example"
}
```

#### Get Campaign

```http
GET /api/campaigns/60f7b3b3b3b3b3b3b3b3b3b3
```

#### List Campaigns

```http
GET /api/campaigns?status=active&page=1&limit=10
```

#### Update Campaign

```http
PUT /api/campaigns/60f7b3b3b3b3b3b3b3b3b3b3
x-wallet-address: 0x1234567890123456789012345678901234567890
Content-Type: application/json

{
  "status": "paused",
  "description": "Updated description"
}
```

#### Participate in Campaign

```http
POST /api/campaigns/60f7b3b3b3b3b3b3b3b3b3b3/participate
x-wallet-address: 0xfan1234567890123456789012345678901234567890
Content-Type: application/json

{
  "action": "stream",
  "proof": "spotify_stream_proof_data"
}
```

### Rewards API

#### Claim Reward

```http
POST /api/rewards/claim
x-wallet-address: 0xfan1234567890123456789012345678901234567890
Content-Type: application/json

{
  "campaignId": "60f7b3b3b3b3b3b3b3b3b3b3",
  "action": "stream",
  "proof": "verified_action_proof"
}
```

#### Get User Rewards

```http
GET /api/rewards/0xfan1234567890123456789012345678901234567890?page=1&limit=10
```

#### Get Campaign Reward Stats

```http
GET /api/rewards/campaign/60f7b3b3b3b3b3b3b3b3b3b3/stats
```

## Example Workflow

1. **Creator Registration**

```bash
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "0x1234567890123456789012345678901234567890",
    "username": "musiccreator",
    "role": "creator",
    "email": "creator@example.com"
  }'
```

2. **Fan Registration**

```bash
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "0xfan1234567890123456789012345678901234567890",
    "username": "musicfan",
    "role": "fan",
    "email": "fan@example.com"
  }'
```

3. **Create Campaign**

```bash
curl -X POST http://localhost:3000/api/campaigns \
  -H "Content-Type: application/json" \
  -H "x-wallet-address: 0x1234567890123456789012345678901234567890" \
  -d '{
    "title": "Stream My New Song",
    "description": "Get rewarded for streaming my latest track",
    "budget": {
      "amount": 500,
      "token": {
        "address": "0xa0b86991c431e803e5f6d5024d9650441c8c5c044",
        "name": "USDC"
      }
    },
    "rewardRules": [{
      "action": "stream",
      "rewardAmount": 0.1,
      "token": {
        "address": "0xa0b86991c431e803e5f6d5024d9650441c8c5c044",
        "name": "USDC"
      }
    }],
    "startDate": "2024-01-01T00:00:00Z",
    "endDate": "2024-12-31T23:59:59Z",
    "contentUrl": "https://open.spotify.com/track/example"
  }'
```

4. **Fan Participation**

```bash
curl -X POST http://localhost:3000/api/campaigns/CAMPAIGN_ID/participate \
  -H "Content-Type: application/json" \
  -H "x-wallet-address: 0xfan1234567890123456789012345678901234567890" \
  -d '{
    "action": "stream",
    "proof": "spotify_listening_history_proof"
  }'
```

5. **Claim Reward**

```bash
curl -X POST http://localhost:3000/api/rewards/claim \
  -H "Content-Type: application/json" \
  -H "x-wallet-address: 0xfan1234567890123456789012345678901234567890" \
  -d '{
    "campaignId": "CAMPAIGN_ID",
    "action": "stream",
    "proof": "verified_stream_proof"
  }'
```

## Error Handling

The API returns consistent error responses:

```json
{
    "success": false,
    "error": "Error message description"
}
```

Common HTTP status codes:

- `200`: Success
- `201`: Created
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (missing/invalid wallet address)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `500`: Internal Server Error

## Validation

All endpoints include comprehensive input validation:

- Wallet addresses must match Ethereum format (`0x` + 40 hex characters)
- Usernames must be 3-30 characters, alphanumeric
- Token addresses are validated against smart contract allowed tokens
- Campaign dates must be valid and end date after start date
- Reward amounts must be positive numbers

## Security Features

- **Wallet-based Authentication**: Users authenticate with wallet addresses
- **Role-based Authorization**: Creators and fans have different permissions
- **Input Sanitization**: All inputs are validated and sanitized
- **Error Handling**: Centralized error handling prevents information leakage
- **CORS Configuration**: Configurable cross-origin resource sharing

## Blockchain Integration

The backend integrates with Lisk L2 blockchain:

- **Token Validation**: Validates campaign tokens against smart contract
- **TVL Calculation**: Retrieves Total Value Locked from on-chain data
- **Allowed Tokens**: Queries smart contract for permitted tokens

Currently supported tokens (mock data):

- USDC: `0xa0b86991c431e803e5f6d5024d9650441c8c5c044`
- USDT: `0xdac17f958d2ee523a2206206994597c13d831ec7`
- LSK: `0x6033f7f88332b8db6ad452b7c6d5bb643990ae3f`
- UNI: `0x1f9840a85d5af5bf1d1762f925bdaddc4201f984`

## Action Verification

The platform supports verification for multiple actions across platforms:

### Supported Platforms

- **Spotify**: Stream, Follow
- **YouTube**: Stream, Like, Comment
- **Twitter**: Share, Follow
- **Instagram**: Follow

### Verification Process

1. User performs action on external platform
2. User submits proof (API response, screenshot hash, etc.)
3. Backend verifies action through platform APIs
4. Verified actions become eligible for rewards

## Development

### Running Tests

```bash
npm test
```

### Code Style

The project follows standard Node.js/Express conventions:

- Use async/await for asynchronous operations
- Implement proper error handling
- Include JSDoc comments for functions
- Follow RESTful API design principles

### Adding New Features

1. **New Routes**: Add to appropriate route file in `/routes`
2. **Controllers**: Implement business logic in `/controllers`
3. **Validation**: Add validation rules in `/middleware/validate.js`
4. **Services**: External integrations go in `/services`

## Deployment

### Environment Setup

1. Set production environment variables
2. Configure MongoDB connection string
3. Set up Lisk L2 RPC endpoint
4. Configure external API credentials

### Production Considerations

- Use process manager (PM2, Docker)
- Set up proper logging and monitoring
- Configure reverse proxy (Nginx)
- Enable HTTPS
- Set up database backups
- Configure rate limiting

## Contributing

1. Fork the repository
2. Create a feature branch
3. Implement changes with tests
4. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For questions or issues:

- Create an issue in the repository
- Check the API documentation
- Review the example workflows above
