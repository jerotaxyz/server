const request = require('supertest');
const app = require('../../app');
const { User } = require('../../models');

describe('Users API', () => {
  describe('POST /api/users/register', () => {
    it('should register a new creator user', async () => {
      const userData = {
        walletAddress: '0x1234567890123456789012345678901234567890',
        username: 'testcreator',
        role: 'creator',
        email: 'creator@example.com',
        twitter: '@testcreator',
        instagram: 'testcreator'
      };

      const response = await request(app)
        .post('/api/users/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toMatchObject({
        walletAddress: userData.walletAddress.toLowerCase(),
        username: userData.username,
        role: userData.role,
        email: userData.email,
        twitter: userData.twitter,
        instagram: userData.instagram
      });

      // Verify user was saved to database
      const savedUser = await User.findOne({ walletAddress: userData.walletAddress.toLowerCase() });
      expect(savedUser).toBeTruthy();
      expect(savedUser.username).toBe(userData.username);
    });

    it('should register a new fan user', async () => {
      const userData = {
        walletAddress: '0x742d35Cc6634C0532925a3b8D4C0532925a3b8D4',
        username: 'testfan',
        role: 'fan',
        email: 'fan@example.com'
      };

      const response = await request(app)
        .post('/api/users/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.role).toBe('fan');
    });

    it('should reject duplicate wallet address', async () => {
      const userData = {
        walletAddress: '0x1234567890123456789012345678901234567890',
        username: 'testcreator',
        role: 'creator',
        email: 'creator@example.com'
      };

      // Register first user
      await request(app)
        .post('/api/users/register')
        .send(userData)
        .expect(201);

      // Try to register with same wallet address
      const duplicateData = {
        ...userData,
        username: 'anothercreator'
      };

      const response = await request(app)
        .post('/api/users/register')
        .send(duplicateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Wallet address already registered');
    });

    it('should reject duplicate username', async () => {
      const userData1 = {
        walletAddress: '0x1234567890123456789012345678901234567890',
        username: 'testcreator',
        role: 'creator',
        email: 'creator1@example.com'
      };

      const userData2 = {
        walletAddress: '0x742d35Cc6634C0532925a3b8D4C0532925a3b8D4',
        username: 'testcreator', // Same username
        role: 'fan',
        email: 'creator2@example.com'
      };

      // Register first user
      await request(app)
        .post('/api/users/register')
        .send(userData1)
        .expect(201);

      // Try to register with same username
      const response = await request(app)
        .post('/api/users/register')
        .send(userData2)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Username already taken');
    });

    it('should validate wallet address format', async () => {
      const userData = {
        walletAddress: 'invalid-address',
        username: 'testcreator',
        role: 'creator',
        email: 'creator@example.com'
      };

      const response = await request(app)
        .post('/api/users/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid wallet address format');
    });

    it('should validate required fields', async () => {
      const userData = {
        walletAddress: '0x1234567890123456789012345678901234567890'
        // Missing username and role
      };

      const response = await request(app)
        .post('/api/users/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/users/:walletAddress', () => {
    beforeEach(async () => {
      // Create test user
      await User.create({
        walletAddress: '0x1234567890123456789012345678901234567890',
        username: 'testcreator',
        role: 'creator',
        email: 'creator@example.com'
      });
    });

    it('should get user details', async () => {
      const response = await request(app)
        .get('/api/users/0x1234567890123456789012345678901234567890')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toMatchObject({
        walletAddress: '0x1234567890123456789012345678901234567890',
        username: 'testcreator',
        role: 'creator',
        email: 'creator@example.com'
      });
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/api/users/0x742d35Cc6634C0532925a3b8D4C0532925a3b8D4')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('User not found');
    });

    it('should validate wallet address format', async () => {
      const response = await request(app)
        .get('/api/users/invalid-address')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid wallet address format');
    });
  });

  describe('PUT /api/users/:walletAddress', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await User.create({
        walletAddress: '0x1234567890123456789012345678901234567890',
        username: 'testcreator',
        role: 'creator',
        email: 'creator@example.com'
      });
    });

    it('should update user details', async () => {
      const updateData = {
        username: 'updatedcreator',
        email: 'updated@example.com',
        twitter: '@updated'
      };

      const response = await request(app)
        .put('/api/users/0x1234567890123456789012345678901234567890')
        .set('x-wallet-address', '0x1234567890123456789012345678901234567890')
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toMatchObject({
        username: updateData.username,
        email: updateData.email,
        twitter: updateData.twitter
      });

      // Verify database was updated
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.username).toBe(updateData.username);
      expect(updatedUser.email).toBe(updateData.email);
      expect(updatedUser.twitter).toBe(updateData.twitter);
    });

    it('should require authentication', async () => {
      const updateData = {
        username: 'updatedcreator'
      };

      const response = await request(app)
        .put('/api/users/0x1234567890123456789012345678901234567890')
        .send(updateData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Wallet address is required');
    });

    it('should only allow users to update their own profile', async () => {
      const updateData = {
        username: 'updatedcreator'
      };

      const response = await request(app)
        .put('/api/users/0x1234567890123456789012345678901234567890')
        .set('x-wallet-address', '0x742d35Cc6634C0532925a3b8D4C0532925a3b8D4')
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should reject duplicate username', async () => {
      // Create another user
      await User.create({
        walletAddress: '0x742d35Cc6634C0532925a3b8D4C0532925a3b8D4',
        username: 'anothercreator',
        role: 'creator',
        email: 'another@example.com'
      });

      const updateData = {
        username: 'anothercreator' // Try to use existing username
      };

      const response = await request(app)
        .put('/api/users/0x1234567890123456789012345678901234567890')
        .set('x-wallet-address', '0x1234567890123456789012345678901234567890')
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Username already taken');
    });
  });
});