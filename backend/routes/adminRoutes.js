const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');
const { updateOrderStatus, deleteOrder, getAllOrders, getOrderById } = require('../controllers/orderController');

// Admin - Get All Users
router.get('/users', verifyToken, isAdmin, async (req, res) => {
  try {
    const users = await User.find({ role: 'customer' }); // assuming role field
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Server Error' });
  }
});

// Toggle customer status
router.put('/customers/:id/toggle-status', verifyToken, isAdmin, async (req, res) => {
  try {
    const customer = await User.findById(req.params.id);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    customer.status = customer.status === 'active' ? 'blocked' : 'active';
    await customer.save();
    res.json({ message: 'Status updated' });
  } catch (err) {
    res.status(500).json({ error: 'Server Error' });
  }
});

// Reset customer password
router.put('/customers/:id/reset-password', verifyToken, isAdmin, async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    const hashed = await require('bcrypt').hash(newPassword, 10);
    await User.findByIdAndUpdate(req.params.id, { password: hashed });
    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server Error' });
  }
});

// Update customer details (view/edit)
router.put('/customers/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const updated = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: 'Customer not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Server Error' });
  }
});

// New route to update order status by admin
router.put('/orders/:id', verifyToken, isAdmin, updateOrderStatus);

// Add DELETE /orders/:id route for admin to delete an order
router.delete('/orders/:id', verifyToken, isAdmin, deleteOrder);

// Add GET /orders route for admin to get all orders with pagination support
router.get('/orders', verifyToken, isAdmin, getAllOrders);

// Add GET /orders/:id route for admin to get order details
router.get('/orders/:id', verifyToken, isAdmin, getOrderById);

module.exports = router;
