const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Jerota Backend API',
      version: '1.0.0',
      description: 'Backend API for Jerota creator campaign and fan rewards platform',
      contact: {
        name: 'Jerota Team',
        email: 'support@jerota.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3002',
        description: 'Development server'
      },
      {
        url: 'https://api.jerota.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        WalletAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-wallet-address',
          description: 'Ethereum wallet address for authentication'
        }
      },
      schemas: {
        User: {
          type: 'object',
          required: ['walletAddress', 'username', 'role'],
          properties: {
            _id: {
              type: 'string',
              description: 'User ID'
            },
            walletAddress: {
              type: 'string',
              pattern: '^0x[a-fA-F0-9]{40}$',
              description: 'Ethereum wallet address',
              example: '0x1234567890123456789012345678901234567890'
            },
            username: {
              type: 'string',
              minLength: 3,
              maxLength: 30,
              description: 'Unique username',
              example: 'testcreator'
            },
            role: {
              type: 'string',
              enum: ['creator', 'fan'],
              description: 'User role',
              example: 'creator'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
              example: 'creator@example.com'
            },
            twitter: {
              type: 'string',
              description: 'Twitter handle',
              example: '@testcreator'
            },
            instagram: {
              type: 'string',
              description: 'Instagram handle',
              example: 'testcreator'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'User creation timestamp'
            },
            campaignsCreated: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Array of campaign IDs created by this user'
            },
            campaignsParticipated: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Array of campaign IDs this user participated in'
            },
            rewardsEarned: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Reward'
              }
            }
          }
        },
        Campaign: {
          type: 'object',
          required: ['creatorId', 'title', 'budget', 'rewardRules', 'startDate', 'endDate', 'contentUrl'],
          properties: {
            _id: {
              type: 'string',
              description: 'Campaign ID'
            },
            creatorId: {
              type: 'string',
              description: 'Creator user ID'
            },
            title: {
              type: 'string',
              minLength: 3,
              maxLength: 100,
              description: 'Campaign title',
              example: 'Support My New Album'
            },
            description: {
              type: 'string',
              maxLength: 1000,
              description: 'Campaign description',
              example: 'Help me fund my upcoming album by streaming and sharing!'
            },
            budget: {
              $ref: '#/components/schemas/TokenAmount'
            },
            rewardRules: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/RewardRule'
              },
              minItems: 1
            },
            status: {
              type: 'string',
              enum: ['draft', 'active', 'completed', 'paused'],
              default: 'draft',
              description: 'Campaign status'
            },
            startDate: {
              type: 'string',
              format: 'date-time',
              description: 'Campaign start date'
            },
            endDate: {
              type: 'string',
              format: 'date-time',
              description: 'Campaign end date'
            },
            contentUrl: {
              type: 'string',
              format: 'uri',
              description: 'URL of the content (Spotify, YouTube, etc.)',
              example: 'https://open.spotify.com/track/example'
            },
            totalTVL: {
              type: 'number',
              minimum: 0,
              description: 'Total Value Locked in USD',
              example: 5000
            },
            participants: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Participant'
              }
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Campaign creation timestamp'
            }
          }
        },
        TokenAmount: {
          type: 'object',
          required: ['amount', 'token'],
          properties: {
            amount: {
              type: 'number',
              minimum: 0,
              description: 'Token amount',
              example: 1000
            },
            token: {
              $ref: '#/components/schemas/Token'
            }
          }
        },
        Token: {
          type: 'object',
          required: ['address', 'name'],
          properties: {
            address: {
              type: 'string',
              pattern: '^0x[a-fA-F0-9]{40}$',
              description: 'Token contract address',
              example: '0x1234567890123456789012345678901234567890'
            },
            name: {
              type: 'string',
              description: 'Token name',
              example: 'USDC'
            }
          }
        },
        RewardRule: {
          type: 'object',
          required: ['action', 'rewardAmount', 'token'],
          properties: {
            action: {
              type: 'string',
              enum: ['stream', 'share', 'comment', 'like', 'follow'],
              description: 'Action type that earns rewards',
              example: 'stream'
            },
            rewardAmount: {
              type: 'number',
              minimum: 0.01,
              description: 'Reward amount for this action',
              example: 0.5
            },
            token: {
              $ref: '#/components/schemas/Token'
            },
            maxClaims: {
              type: 'number',
              minimum: 0,
              description: 'Maximum number of times this reward can be claimed per user',
              example: 10
            }
          }
        },
        Participant: {
          type: 'object',
          properties: {
            userId: {
              type: 'string',
              description: 'Participant user ID'
            },
            actions: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Action'
              }
            }
          }
        },
        Action: {
          type: 'object',
          properties: {
            actionType: {
              type: 'string',
              enum: ['stream', 'share', 'comment', 'like', 'follow'],
              description: 'Type of action performed'
            },
            verifiedAt: {
              type: 'string',
              format: 'date-time',
              description: 'When the action was verified'
            },
            proof: {
              type: 'string',
              description: 'Proof hash of the action'
            }
          }
        },
        Reward: {
          type: 'object',
          properties: {
            campaignId: {
              type: 'string',
              description: 'Campaign ID'
            },
            amount: {
              type: 'number',
              minimum: 0,
              description: 'Reward amount'
            },
            token: {
              $ref: '#/components/schemas/Token'
            },
            claimedAt: {
              type: 'string',
              format: 'date-time',
              description: 'When the reward was claimed'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'string',
              description: 'Error message',
              example: 'Validation failed'
            }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            data: {
              type: 'object',
              description: 'Response data'
            }
          }
        }
      }
    }
  },
  apis: ['./routes/*.js', './controllers/*.js']
};

const specs = swaggerJsdoc(options);

module.exports = {
  specs,
  swaggerUi,
  serve: swaggerUi.serve,
  setup: swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Jerota API Documentation'
  })
};