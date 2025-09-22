const request = require('supertest');
const app = require('../../app');
const { User, Campaign } = require('../../models');

describe('Rewards API', () => {
  let creatorUser, fanUser, testCampaign;

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

    // Create test campaign
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

    // Add fan participation
    testCampaign.participants.push({
      userId: fanUser._id,
      actions: [
        {
          actionType: 'stream',
          verifiedAt: new Date(),
          proof: 'c3BvdGlmeV9zdHJlYW1fcHJvb2ZfZGF0'
        }
      ]
    });
    await testCampaign.save();

    // Update fan's participated campaigns
    fanUser.campaignsParticipated.push(testCampaign._id);
    await fanUser.save();
  });

  describe('POST /api/rewards/claim', () => {
    it('should claim a reward for verified action', async () => {
      const claimData = {
        campaignId: testCampaign._id.toString(),
        action: 'stream',
        proof: 'spotify_stream_proof_data_67890'
      };

      const response = await request(app)
        .post('/api/rewards/claim')
        .set('x-wallet-address', fanUser.walletAddress)
        .send(claimData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBe('Reward claimed successfully');
      expect(response.body.data.reward).toMatchObject({
        campaignId: testCampaign._id.toString(),
        campaignTitle: testCampaign.title,
        action: 'stream',
        amount: 0.5,
        token: {
          address: '0x1234567890123456789012345678901234567890',
          name: 'USDC'
        }
      });

      // Verify reward was added to user
      const updatedFan = await User.findById(fanUser._id);
      expect(updatedFan.rewardsEarned).toHaveLength(1);
      expect(updatedFan.rewardsEarned[0]).toMatchObject({
        campaignId: testCampaign._id,
        amount: 0.5,
        token: {
          address: '0x1234567890123456789012345678901234567890',
          name: 'USDC'
        }
      });
    });

    it('should require fan role', async () => {
      const claimData = {
        campaignId: testCampaign._id.toString(),
        action: 'stream',
        proof: 'some_proof'
      };

      const response = await request(app)
        .post('/api/rewards/claim')
        .set('x-wallet-address', creatorUser.walletAddress)
        .send(claimData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Role creator is not authorized to access this resource');
    });

    it('should reject claims for inactive campaigns', async () => {
      // Update campaign to draft status
      await Campaign.findByIdAndUpdate(testCampaign._id, { status: 'draft' });

      const claimData = {
        campaignId: testCampaign._id.toString(),
        action: 'stream',
        proof: 'some_proof'
      };

      const response = await request(app)
        .post('/api/rewards/claim')
        .set('x-wallet-address', fanUser.walletAddress)
        .send(claimData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Campaign is not active');
    });

    it('should reject claims for non-existent campaigns', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const claimData = {
        campaignId: fakeId,
        action: 'stream',
        proof: 'some_proof'
      };

      const response = await request(app)
        .post('/api/rewards/claim')
        .set('x-wallet-address', fanUser.walletAddress)
        .send(claimData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Campaign not found');
    });

    it('should reject claims for invalid actions', async () => {
      const claimData = {
        campaignId: testCampaign._id.toString(),
        action: 'invalid_action',
        proof: 'some_proof'
      };

      const response = await request(app)
        .post('/api/rewards/claim')
        .set('x-wallet-address', fanUser.walletAddress)
        .send(claimData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid action type');
    });

    it('should reject claims without participation', async () => {
      // Create another fan without participation
      const anotherFan = await User.create({
        walletAddress: '0x9999999999999999999999999999999999999999',
        username: 'anotherfan',
        role: 'fan',
        email: 'another@example.com'
      });

      const claimData = {
        campaignId: testCampaign._id.toString(),
        action: 'stream',
        proof: 'some_proof'
      };

      const response = await request(app)
        .post('/api/rewards/claim')
        .set('x-wallet-address', anotherFan.walletAddress)
        .send(claimData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('User has not participated in this campaign');
    });
  });

  describe('GET /api/rewards/:walletAddress', () => {
    beforeEach(async () => {
      // Add some rewards to the fan
      fanUser.rewardsEarned.push(
        {
          campaignId: testCampaign._id,
          amount: 0.5,
          token: {
            address: '0x1234567890123456789012345678901234567890',
            name: 'USDC'
          },
          claimedAt: new Date()
        },
        {
          campaignId: testCampaign._id,
          amount: 0.3,
          token: {
            address: '0x1234567890123456789012345678901234567890',
            name: 'USDC'
          },
          claimedAt: new Date()
        }
      );
      await fanUser.save();
    });

    it('should get user rewards', async () => {
      const response = await request(app)
        .get(`/api/rewards/${fanUser.walletAddress}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toMatchObject({
        walletAddress: fanUser.walletAddress,
        username: fanUser.username
      });
      expect(response.body.data.rewards).toHaveLength(2);
      expect(response.body.data.summary).toHaveLength(1);
      expect(response.body.data.summary[0]).toMatchObject({
        token: {
          address: '0x1234567890123456789012345678901234567890',
          name: 'USDC'
        },
        totalAmount: 0.8,
        claimCount: 2
      });
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get(`/api/rewards/${fanUser.walletAddress}?page=1&limit=1`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.rewards).toHaveLength(1);
      expect(response.body.data.pagination).toMatchObject({
        page: 1,
        limit: 1,
        total: 2,
        pages: 2
      });
    });

    it('should return empty rewards for user with no rewards', async () => {
      const response = await request(app)
        .get(`/api/rewards/${creatorUser.walletAddress}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.rewards).toHaveLength(0);
      expect(response.body.data.summary).toHaveLength(0);
    });

    it('should return 404 for non-existent user', async () => {
      const fakeAddress = '0x9999999999999999999999999999999999999999';
      const response = await request(app)
        .get(`/api/rewards/${fakeAddress}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('User not found');
    });

    it('should validate wallet address format', async () => {
      const response = await request(app)
        .get('/api/rewards/invalid-address')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid wallet address format');
    });
  });

  describe('GET /api/rewards/campaign/:campaignId/stats', () => {
    beforeEach(async () => {
      // Add rewards to users
      fanUser.rewardsEarned.push({
        campaignId: testCampaign._id,
        amount: 0.5,
        token: {
          address: '0x1234567890123456789012345678901234567890',
          name: 'USDC'
        },
        claimedAt: new Date()
      });
      await fanUser.save();

      // Create another fan with rewards
      const anotherFan = await User.create({
        walletAddress: '0x9999999999999999999999999999999999999999',
        username: 'anotherfan',
        role: 'fan',
        email: 'another@example.com',
        rewardsEarned: [
          {
            campaignId: testCampaign._id,
            amount: 0.3,
            token: {
              address: '0x1234567890123456789012345678901234567890',
              name: 'USDC'
            },
            claimedAt: new Date()
          }
        ]
      });
    });

    it('should get campaign reward statistics', async () => {
      const response = await request(app)
        .get(`/api/rewards/campaign/${testCampaign._id}/stats`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        campaignId: testCampaign._id.toString(),
        campaignTitle: testCampaign.title,
        totalParticipants: 2,
        totalRewardsClaimed: 2,
        participantCount: 1
      });
      expect(response.body.data.rewardsByToken).toHaveLength(1);
      expect(response.body.data.rewardsByToken[0]).toMatchObject({
        token: {
          address: '0x1234567890123456789012345678901234567890',
          name: 'USDC'
        },
        totalAmount: 0.8,
        claimCount: 2
      });
      expect(response.body.data.actionCounts).toMatchObject({
        stream: 1
      });
    });

    it('should return 404 for non-existent campaign', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .get(`/api/rewards/campaign/${fakeId}/stats`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Campaign not found');
    });

    it('should validate campaign ID format', async () => {
      const response = await request(app)
        .get('/api/rewards/campaign/invalid-id/stats')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid campaign ID format');
    });
  });
});