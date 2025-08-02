const request = require('supertest');
const app = require('../index'); // Adjust if your Express app is exported from a different file

describe('Customer API Tests', () => {
  let adminToken = '';
  let customerId = '';

  beforeAll(async () => {
    // Login as admin to get token
    const res = await request(app)
      .post('/api/auth/admin-login')
      .send({ email: 'admin@example.com', password: 'adminpassword' }); // Use valid test credentials
    adminToken = res.body.token;
  });

  test('Get all customers should require admin token', async () => {
    const res = await request(app).get('/api/customers');
    expect(res.statusCode).toBe(401);
  });

  test('Get all customers with admin token', async () => {
    const res = await request(app)
      .get('/api/customers')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    if (res.body.length > 0) {
      customerId = res.body[0]._id;
    }
  });

  test('Impersonate customer', async () => {
    if (!customerId) return;
    const res = await request(app)
      .post(`/api/customers/${customerId}/impersonate`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  // Additional tests for getById, update, delete, toggleStatus, resetPassword can be added similarly
});
