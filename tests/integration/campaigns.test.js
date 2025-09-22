const request = require('supertest');
const app = require('../../app');
const { User, Campaign } = require('../../models');

describe('Campaigns API', () => {
  let creatorUser, fanUser;

  beforeEach(async () => {
    // Create test users
    creatorUser = await User.create({
      walletAddress: '0x1234567890123456789012345678901234567890',
      username: 'testcreator',
      role: 'creator',
      email: 'creator@example.com'
    });

    fanUser = await User.create({
      walletAddress: '0x742d35Cc6634C0532925a3b8D4C0532925a3b8D4',
      username: 'testfan',
      role: 'fan',
      email: 'fan@example.com'
    });
  });

  describe('POST /api/campaigns', () => {
    it('should create a new campaign', async () => {
      const campaignData = {
        title: 'Test Music Campaign',
        description: 'Support my new album',
        budget: {
          amount: 1000,
          token: {
            address: '0x1234567890123456789012345678901234567890',
            name: 'USDC'
          }
        },
        rewardRules: [
          {
            action: 'stream',
            rewardAmount: 0.5,
            token: {
              address: '0x1234567890123456789012345678901234567890',
              name: 'USDC'
            },
            maxClaims: 10
          }
        ],
        startDate: '2025-01-01T00:00:00Z',
        endDate: '2025-12-31T23:59:59Z',
        contentUrl: 'https://open.spotify.com/track/example'
      };

      const response = await request(app)
        .post('/api/campaigns')
        .set('x-wallet-address', creatorUser.walletAddress)
        .send(campaignData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.campaign).toMatchObject({
        title: campaignData.title,
        description: campaignData.description,
        status: 'draft',
        contentUrl: campaignData.contentUrl
      });

      // Verify campaign was saved to database
      const savedCampaign = await Campaign.findById(response.body.data.campaign._id);
      expect(savedCampaign).toBeTruthy();
      expect(savedCampaign.title).toBe(campaignData.title);

      // Verify creator's campaignsCreated was updated
      const updatedCreator = await User.findById(creatorUser._id);
      expect(updatedCreator.campaignsCreated).toContainEqual(savedCampaign._id);
    });

    it('should require creator role', async () => {
      const campaignData = {
        title: 'Test Campaign',
        budget: {
          amount: 1000,
          token: {
            address: '0x1234567890123456789012345678901234567890',
            name: 'USDC'
          }
        },
        rewardRules: [
          {
            action: 'stream',
            rewardAmount: 0.5,
            token: {
              address: '0x1234567890123456789012345678901234567890',
              name: 'USDC'
            }
          }
        ],
        startDate: '2025-01-01T00:00:00Z',
        endDate: '2025-12-31T23:59:59Z',
        contentUrl: 'https://open.spotify.com/track/example'
      };

      const response = await request(app)
        .post('/api/campaigns')
        .set('x-wallet-address', fanUser.walletAddress)
        .send(campaignData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Role fan is not authorized to access this resource');
    });

    it('should validate token addresses', async () => {
      const campaignData = {
        title: 'Test Campaign',
        budget: {
          amount: 1000,
          token: {
            address: '0x9999999999999999999999999999999999999999', // Not in allowed tokens
            name: 'INVALID'
          }
        },
        rewardRules: [
          {
            action: 'stream',
            rewardAmount: 0.5,
            token: {
              address: '0x9999999999999999999999999999999999999999',
              name: 'INVALID'
            }
          }
        ],
        startDate: '2025-01-01T00:00:00Z',
        endDate: '2025-12-31T23:59:59Z',
        contentUrl: 'https://open.spotify.com/track/example'
      };

      const response = await request(app)
        .post('/api/campaigns')
        .set('x-wallet-address', creatorUser.walletAddress)
        .send(campaignData)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('is not allowed');
    });

    it('should validate date range', async () => {
      const campaignData = {
        title: 'Test Campaign',
        budget: {
          amount: 1000,
          token: {
            address: '0x1234567890123456789012345678901234567890',
            name: 'USDC'
          }
        },
        rewardRules: [
          {
            action: 'stream',
            rewardAmount: 0.5,
            token: {
              address: '0x1234567890123456789012345678901234567890',
              name: 'USDC'
            }
          }
        ],
        startDate: '2025-12-31T23:59:59Z',
        endDate: '2025-01-01T00:00:00Z', // End before start
        contentUrl: 'https://open.spotify.com/track/example'
      };

      const response = await request(app)
        .post('/api/campaigns')
        .set('x-wallet-address', creatorUser.walletAddress)
        .send(campaignData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('End date must be after start date');
    });
  });

  describe('GET /api/campaigns/:id', () => {
    let testCampaign;

    beforeEach(async () => {
      testCampaign = await Campaign.create({
        creatorId: creatorUser._id,
        title: 'Test Campaign',
        description: 'Test description',
        budget: {
          amount: 1000,
          token: {
            address: '0x1234567890123456789012345678901234567890',
            name: 'USDC'
          }
        },
        rewardRules: [
          {
            action: 'stream',
            rewardAmount: 0.5,
            token: {
              address: '0x1234567890123456789012345678901234567890',
              name: 'USDC'
            }
          }
        ],
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        contentUrl: 'https://open.spotify.com/track/example'
      });
    });

    it('should get campaign details', async () => {
      const response = await request(app)
        .get(`/api/campaigns/${testCampaign._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.campaign).toMatchObject({
        title: testCampaign.title,
        description: testCampaign.description,
        contentUrl: testCampaign.contentUrl
      });
    });

    it('should return 404 for non-existent campaign', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .get(`/api/campaigns/${fakeId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Campaign not found');
    });
  });

  describe('GET /api/campaigns', () => {
    beforeEach(async () => {
      // Create multiple test campaigns
      await Campaign.create({
        creatorId: creatorUser._id,
        title: 'Active Campaign',
        status: 'active',
        budget: {
          amount: 1000,
          token: {
            address: '0x1234567890123456789012345678901234567890',
            name: 'USDC'
          }
        },
        rewardRules: [
          {
            action: 'stream',
            rewardAmount: 0.5,
            token: {
              address: '0x1234567890123456789012345678901234567890',
              name: 'USDC'
            }
          }
        ],
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        contentUrl: 'https://open.spotify.com/track/example1'
      });

      await Campaign.create({
        creatorId: creatorUser._id,
        title: 'Draft Campaign',
        status: 'draft',
        budget: {
          amount: 500,
          token: {
            address: '0x1234567890123456789012345678901234567890',
            name: 'USDC'
          }
        },
        rewardRules: [
          {
            action: 'like',
            rewardAmount: 0.1,
            token: {
              address: '0x1234567890123456789012345678901234567890',
              name: 'USDC'
            }
          }
        ],
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        contentUrl: 'https://open.spotify.com/track/example2'
      });
    });

    it('should list all campaigns', async () => {
      const response = await request(app)
        .get('/api/campaigns')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.campaigns).toHaveLength(2);
      expect(response.body.data.pagination).toMatchObject({
        page: 1,
        limit: 10,
        total: 2,
        pages: 1
      });
    });

    it('should filter campaigns by status', async () => {
      const response = await request(app)
        .get('/api/campaigns?status=active')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.campaigns).toHaveLength(1);
      expect(response.body.data.campaigns[0].status).toBe('active');
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/campaigns?page=1&limit=1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.campaigns).toHaveLength(1);
      expect(response.body.data.pagination).toMatchObject({
        page: 1,
        limit: 1,
        total: 2,
        pages: 2
      });
    });
  });

  describe('PUT /api/campaigns/:id', () => {
    let testCampaign;

    beforeEach(async () => {
      testCampaign = await Campaign.create({
        creatorId: creatorUser._id,
        title: 'Test Campaign',
        description: 'Test description',
        status: 'draft',
        budget: {
          amount: 1000,
          token: {
            address: '0x1234567890123456789012345678901234567890',
            name: 'USDC'
          }
        },
        rewardRules: [
          {
            action: 'stream',
            rewardAmount: 0.5,
            token: {
              address: '0x1234567890123456789012345678901234567890',
              name: 'USDC'
            }
          }
        ],
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        contentUrl: 'https://open.spotify.com/track/example'
      });
    });

    it('should update campaign status', async () => {
      const updateData = {
        status: 'active',
        description: 'Updated description'
      };

      const response = await request(app)
        .put(`/api/campaigns/${testCampaign._id}`)
        .set('x-wallet-address', creatorUser.walletAddress)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.campaign.status).toBe('active');
      expect(response.body.data.campaign.description).toBe('Updated description');
    });

    it('should only allow campaign creator to update', async () => {
      const updateData = {
        status: 'active'
      };

      const response = await request(app)
        .put(`/api/campaigns/${testCampaign._id}`)
        .set('x-wallet-address', fanUser.walletAddress)
        .send(updateData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Role fan is not authorized to access this resource');
    });
  });

  describe('POST /api/campaigns/:id/participate', () => {
    let testCampaign;

    beforeEach(async () => {
      testCampaign = await Campaign.create({
        creatorId: creatorUser._id,
        title: 'Test Campaign',
        description: 'Test description',
        status: 'active',
        budget: {
          amount: 1000,
          token: {
            address: '0x1234567890123456789012345678901234567890',
            name: 'USDC'
          }
        },
        rewardRules: [
          {
            action: 'stream',
            rewardAmount: 0.5,
            token: {
              address: '0x1234567890123456789012345678901234567890',
              name: 'USDC'
            },
            maxClaims: 10
          }
        ],
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        contentUrl: 'https://open.spotify.com/track/example'
      });
    });

    it('should record fan participation', async () => {
      const participationData = {
        action: 'stream',
        proof: 'spotify_stream_proof_12345'
      };

      const response = await request(app)
        .post(`/api/campaigns/${testCampaign._id}/participate`)
        .set('x-wallet-address', fanUser.walletAddress)
        .send(participationData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBe('Participation recorded successfully');
      expect(response.body.data.verification.verified).toBe(true);
      expect(response.body.data.rewardEligible).toBe(true);
      expect(response.body.data.rewardAmount).toBe(0.5);

      // Verify participation was saved
      const updatedCampaign = await Campaign.findById(testCampaign._id);
      expect(updatedCampaign.participants).toHaveLength(1);
      expect(updatedCampaign.participants[0].userId.toString()).toBe(fanUser._id.toString());

      // Verify fan's campaignsParticipated was updated
      const updatedFan = await User.findById(fanUser._id);
      expect(updatedFan.campaignsParticipated).toContainEqual(testCampaign._id);
    });

    it('should require fan role', async () => {
      const participationData = {
        action: 'stream',
        proof: 'spotify_stream_proof_12345'
      };

      const response = await request(app)
        .post(`/api/campaigns/${testCampaign._id}/participate`)
        .set('x-wallet-address', creatorUser.walletAddress)
        .send(participationData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Role creator is not authorized to access this resource');
    });

    it('should reject participation in inactive campaigns', async () => {
      // Update campaign to draft status
      await Campaign.findByIdAndUpdate(testCampaign._id, { status: 'draft' });

      const participationData = {
        action: 'stream',
        proof: 'spotify_stream_proof_12345'
      };

      const response = await request(app)
        .post(`/api/campaigns/${testCampaign._id}/participate`)
        .set('x-wallet-address', fanUser.walletAddress)
        .send(participationData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Campaign is not active');
    });

    it('should reject invalid actions', async () => {
      const participationData = {
        action: 'invalid_action',
        proof: 'some_proof'
      };

      const response = await request(app)
        .post(`/api/campaigns/${testCampaign._id}/participate`)
        .set('x-wallet-address', fanUser.walletAddress)
        .send(participationData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid action type');
    });
  });
});