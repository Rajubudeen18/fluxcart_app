const request = require('supertest');
const app = require('../index'); // Adjust if your Express app is exported from a different file

describe('Product API Tests', () => {
  let adminToken = '';
  let productId = '';

  beforeAll(async () => {
    // Login as admin to get token
    const res = await request(app)
      .post('/api/auth/admin-login')
      .send({ email: 'admin@example.com', password: 'adminpassword' }); // Use valid test credentials
    adminToken = res.body.token;
  });

  test('Get all products should require token', async () => {
    const res = await request(app).get('/api/products');
    expect(res.statusCode).toBe(401);
  });

  test('Get all products with token', async () => {
    const res = await request(app)
      .get('/api/products')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    if (res.body.length > 0) {
      productId = res.body[0]._id;
    }
  });

  test('Create product', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Test Product',
        description: 'Test Description',
        price: 9.99,
        stock_quantity: 10,
        image: ''
      });
    expect(res.statusCode).toBe(201);
    expect(res.body._id).toBeDefined();
    productId = res.body._id;
  });

  test('Update product', async () => {
    if (!productId) return;
    const res = await request(app)
      .put(`/api/products/${productId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ price: 19.99 });
    expect(res.statusCode).toBe(200);
    expect(res.body.price).toBe(19.99);
  });

  test('Delete product', async () => {
    if (!productId) return;
    const res = await request(app)
      .delete(`/api/products/${productId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
  });
});
