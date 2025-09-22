const blockchainService = require('../../../services/blockchain');

describe('BlockchainService', () => {
  beforeEach(() => {
    // Clear cache before each test
    blockchainService.allowedTokensCache = null;
    blockchainService.cacheExpiry = null;
  });

  describe('getAllowedTokens', () => {
    it('should return allowed tokens', async () => {
      const tokens = await blockchainService.getAllowedTokens();

      expect(tokens).toBeInstanceOf(Array);
      expect(tokens.length).toBeGreaterThan(0);
      expect(tokens[0]).toHaveProperty('address');
      expect(tokens[0]).toHaveProperty('name');
      expect(tokens[0].address).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });

    it('should cache tokens', async () => {
      const tokens1 = await blockchainService.getAllowedTokens();
      const tokens2 = await blockchainService.getAllowedTokens();

      expect(tokens1).toEqual(tokens2);
      expect(blockchainService.allowedTokensCache).toBeTruthy();
      expect(blockchainService.cacheExpiry).toBeTruthy();
    });

    it('should refresh cache after expiry', async () => {
      // Get tokens first time
      await blockchainService.getAllowedTokens();
      expect(blockchainService.allowedTokensCache).toBeTruthy();

      // Manually expire cache
      blockchainService.cacheExpiry = Date.now() - 1000;

      // Get tokens again - should refresh cache
      const tokens = await blockchainService.getAllowedTokens();
      expect(tokens).toBeTruthy();
      expect(blockchainService.cacheExpiry).toBeGreaterThan(Date.now() - 1000);
    });
  });

  describe('isTokenAllowed', () => {
    it('should return true for allowed tokens', async () => {
      const tokens = await blockchainService.getAllowedTokens();
      const firstToken = tokens[0];

      const isAllowed = await blockchainService.isTokenAllowed(firstToken.address);
      expect(isAllowed).toBe(true);
    });

    it('should return false for non-allowed tokens', async () => {
      const fakeAddress = '0x9999999999999999999999999999999999999999';
      const isAllowed = await blockchainService.isTokenAllowed(fakeAddress);
      expect(isAllowed).toBe(false);
    });

    it('should be case insensitive', async () => {
      const tokens = await blockchainService.getAllowedTokens();
      const firstToken = tokens[0];

      const isAllowed = await blockchainService.isTokenAllowed(firstToken.address.toUpperCase());
      expect(isAllowed).toBe(true);
    });
  });

  describe('getTokenInfo', () => {
    it('should return token info for allowed tokens', async () => {
      const tokens = await blockchainService.getAllowedTokens();
      const firstToken = tokens[0];

      const tokenInfo = await blockchainService.getTokenInfo(firstToken.address);
      expect(tokenInfo).toEqual(firstToken);
    });

    it('should return null for non-allowed tokens', async () => {
      const fakeAddress = '0x9999999999999999999999999999999999999999';
      const tokenInfo = await blockchainService.getTokenInfo(fakeAddress);
      expect(tokenInfo).toBeNull();
    });
  });

  describe('getCampaignTVL', () => {
    it('should return a positive TVL value', async () => {
      const campaignId = 'test-campaign-id';
      const tvl = await blockchainService.getCampaignTVL(campaignId);

      expect(typeof tvl).toBe('number');
      expect(tvl).toBeGreaterThanOrEqual(0);
    });
  });

  describe('validateCampaignTokens', () => {
    it('should validate campaign with allowed tokens', async () => {
      const tokens = await blockchainService.getAllowedTokens();
      const firstToken = tokens[0];

      const campaignData = {
        budget: {
          token: {
            address: firstToken.address,
            name: firstToken.name
          }
        },
        rewardRules: [
          {
            token: {
              address: firstToken.address,
              name: firstToken.name
            }
          }
        ]
      };

      const isValid = await blockchainService.validateCampaignTokens(campaignData);
      expect(isValid).toBe(true);
    });

    it('should reject campaign with non-allowed budget token', async () => {
      const campaignData = {
        budget: {
          token: {
            address: '0x9999999999999999999999999999999999999999',
            name: 'FAKE'
          }
        },
        rewardRules: []
      };

      await expect(blockchainService.validateCampaignTokens(campaignData))
        .rejects.toThrow('is not allowed');
    });

    it('should reject campaign with non-allowed reward token', async () => {
      const tokens = await blockchainService.getAllowedTokens();
      const firstToken = tokens[0];

      const campaignData = {
        budget: {
          token: {
            address: firstToken.address,
            name: firstToken.name
          }
        },
        rewardRules: [
          {
            token: {
              address: '0x9999999999999999999999999999999999999999',
              name: 'FAKE'
            }
          }
        ]
      };

      await expect(blockchainService.validateCampaignTokens(campaignData))
        .rejects.toThrow('is not allowed');
    });
  });
});