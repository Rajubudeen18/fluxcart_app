const request = require('supertest');
const app = require('../index'); // Adjust if your Express app is exported from a different file

describe('Authentication API Tests', () => {
  let adminToken = '';
  let customerToken = '';

  test('Admin login with valid credentials should return token', async () => {
    const res = await request(app)
      .post('/api/auth/admin-login')
      .send({ email: 'admin@example.com', password: 'adminpassword' }); // Use valid test credentials
    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
    adminToken = res.body.token;
  });

  test('Customer login with valid credentials should return token', async () => {
    const res = await request(app)
      .post('/api/auth/customer-login')
      .send({ email: 'customer@example.com', password: 'customerpassword' }); // Use valid test credentials
    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
    customerToken = res.body.token;
  });

  test('Login with invalid credentials should return 400', async () => {
    const res = await request(app)
      .post('/api/auth/customer-login')
      .send({ email: 'wrong@example.com', password: 'wrongpassword' });
    expect(res.statusCode).toBe(400);
  });
});

module.exports = { adminToken, customerToken };
