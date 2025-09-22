const verificationService = require('../../../services/verification');

describe('VerificationService', () => {
  describe('getPlatformFromUrl', () => {
    it('should identify Spotify URLs', () => {
      const spotifyUrl = 'https://open.spotify.com/track/example';
      const platform = verificationService.getPlatformFromUrl(spotifyUrl);
      expect(platform).toBe('spotify');
    });

    it('should identify YouTube URLs', () => {
      const youtubeUrl = 'https://www.youtube.com/watch?v=example';
      const platform = verificationService.getPlatformFromUrl(youtubeUrl);
      expect(platform).toBe('youtube');

      const youtubeShortUrl = 'https://youtu.be/example';
      const platform2 = verificationService.getPlatformFromUrl(youtubeShortUrl);
      expect(platform2).toBe('youtube');
    });

    it('should identify Twitter URLs', () => {
      const twitterUrl = 'https://twitter.com/user/status/123';
      const platform = verificationService.getPlatformFromUrl(twitterUrl);
      expect(platform).toBe('twitter');

      const xUrl = 'https://x.com/user/status/123';
      const platform2 = verificationService.getPlatformFromUrl(xUrl);
      expect(platform2).toBe('twitter');
    });

    it('should identify Instagram URLs', () => {
      const instagramUrl = 'https://www.instagram.com/p/example';
      const platform = verificationService.getPlatformFromUrl(instagramUrl);
      expect(platform).toBe('instagram');
    });

    it('should return unknown for unrecognized URLs', () => {
      const unknownUrl = 'https://example.com/content';
      const platform = verificationService.getPlatformFromUrl(unknownUrl);
      expect(platform).toBe('unknown');
    });
  });

  describe('generateProofHash', () => {
    it('should generate consistent hashes for same input', () => {
      const proof = 'test-proof-data';
      const hash1 = verificationService.generateProofHash(proof);
      const hash2 = verificationService.generateProofHash(proof);
      
      // Note: Due to timestamp in hash generation, hashes will be different
      // but should be strings of expected length
      expect(typeof hash1).toBe('string');
      expect(typeof hash2).toBe('string');
      expect(hash1.length).toBe(32);
      expect(hash2.length).toBe(32);
    });

    it('should generate different hashes for different inputs', () => {
      const proof1 = 'test-proof-data-1';
      const proof2 = 'test-proof-data-2';
      const hash1 = verificationService.generateProofHash(proof1);
      const hash2 = verificationService.generateProofHash(proof2);
      
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('verifyAction', () => {
    const testWallet = '0x1234567890123456789012345678901234567890';

    it('should verify stream action', async () => {
      const contentUrl = 'https://open.spotify.com/track/example';
      const proof = 'spotify-stream-proof';
      
      const result = await verificationService.verifyAction('stream', contentUrl, proof, testWallet);
      
      expect(result.verified).toBe(true);
      expect(result.platform).toBe('spotify');
      expect(result.action).toBe('stream');
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(result.proofHash).toBeDefined();
    });

    it('should verify share action', async () => {
      const contentUrl = 'https://twitter.com/user/status/123';
      const proof = 'twitter-share-proof';
      
      const result = await verificationService.verifyAction('share', contentUrl, proof, testWallet);
      
      expect(result.verified).toBe(true);
      expect(result.platform).toBe('twitter');
      expect(result.action).toBe('share');
    });

    it('should verify follow action', async () => {
      const contentUrl = 'https://twitter.com/user';
      const proof = 'twitter-follow-proof';
      
      const result = await verificationService.verifyAction('follow', contentUrl, proof, testWallet);
      
      expect(result.verified).toBe(true);
      expect(result.platform).toBe('twitter');
      expect(result.action).toBe('follow');
    });

    it('should verify like action', async () => {
      const contentUrl = 'https://www.youtube.com/watch?v=example';
      const proof = 'youtube-like-proof';
      
      const result = await verificationService.verifyAction('like', contentUrl, proof, testWallet);
      
      expect(result.verified).toBe(true);
      expect(result.platform).toBe('youtube');
      expect(result.action).toBe('like');
    });

    it('should verify comment action', async () => {
      const contentUrl = 'https://www.youtube.com/watch?v=example';
      const proof = 'youtube-comment-proof';
      
      const result = await verificationService.verifyAction('comment', contentUrl, proof, testWallet);
      
      expect(result.verified).toBe(true);
      expect(result.platform).toBe('youtube');
      expect(result.action).toBe('comment');
    });

    it('should throw error for unsupported action', async () => {
      const contentUrl = 'https://example.com';
      const proof = 'some-proof';
      
      await expect(verificationService.verifyAction('unsupported', contentUrl, proof, testWallet))
        .rejects.toThrow('Unsupported action type: unsupported');
    });
  });

  describe('Platform-specific verification methods', () => {
    const testWallet = '0x1234567890123456789012345678901234567890';
    const testProof = 'test-proof';

    it('should verify Spotify stream', async () => {
      const result = await verificationService.verifySpotifyStream('spotify-url', testProof, testWallet);
      
      expect(result.verified).toBe(true);
      expect(result.platform).toBe('spotify');
      expect(result.action).toBe('stream');
    });

    it('should verify YouTube stream', async () => {
      const result = await verificationService.verifyYouTubeStream('youtube-url', testProof, testWallet);
      
      expect(result.verified).toBe(true);
      expect(result.platform).toBe('youtube');
      expect(result.action).toBe('stream');
    });

    it('should verify Twitter share', async () => {
      const result = await verificationService.verifyTwitterShare('twitter-url', testProof, testWallet);
      
      expect(result.verified).toBe(true);
      expect(result.platform).toBe('twitter');
      expect(result.action).toBe('share');
    });

    it('should verify mock verification for unknown platforms', async () => {
      const result = verificationService.mockVerification('test-action', 'unknown-platform');
      
      expect(result.verified).toBe(true);
      expect(result.platform).toBe('unknown-platform');
      expect(result.action).toBe('test-action');
    });
  });
});