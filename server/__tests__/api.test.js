const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../server');
const User = require('../models/User');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
});

describe('User API Endpoints', () => {
  describe('POST /api/users/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        userType: 'patient'
      };

      const response = await request(app)
        .post('/api/users/register')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('name', userData.name);
      expect(response.body.user).toHaveProperty('email', userData.email);
      expect(response.body.user).toHaveProperty('userType', userData.userType);
    });

    it('should not register a user with existing email', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        userType: 'patient'
      };

      // First registration
      await request(app)
        .post('/api/users/register')
        .send(userData);

      // Second registration with same email
      const response = await request(app)
        .post('/api/users/register')
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'User already exists with this email');
    });
  });

  describe('POST /api/users/login', () => {
    beforeEach(async () => {
      // Create a test user
      await request(app)
        .post('/api/users/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          userType: 'patient'
        });
    });

    it('should login successfully with correct credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/users/login')
        .send(loginData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('email', loginData.email);
    });

    it('should not login with incorrect password', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/users/login')
        .send(loginData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Invalid credentials');
    });
  });

  describe('GET /api/users/profile', () => {
    let token;
    let userId;

    beforeEach(async () => {
      // Create a test user and get token
      const registerResponse = await request(app)
        .post('/api/users/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          userType: 'patient'
        });

      token = registerResponse.body.token;
      userId = registerResponse.body.user.id;
    });

    it('should get user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', userId);
      expect(response.body).toHaveProperty('name', 'Test User');
      expect(response.body).toHaveProperty('email', 'test@example.com');
    });

    it('should not get profile without token', async () => {
      const response = await request(app)
        .get('/api/users/profile');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Please authenticate');
    });
  });
}); 