require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const adminRoutes = require('./routes/adminRoutes');
const customerRoutes = require('./routes/customerRoutes');
const customerUserRoutes = require('./routes/customerUserRoutes');

const path = require('path');
const logger = require('./middleware/loggerMiddleware');
const orderRoutes = require('./routes/orderRoutes');
const app = express();

app.use(cors());
app.use(express.json());

// Logging middleware
app.use(logger);

// CRITICAL: Serve static files from your 'frontend' directory
// This line needs to be BEFORE your API routes, so Express serves your HTML, JS, CSS.
app.use(express.static(path.join(__dirname, '../frontend')));

// Add a specific static route for the CSS folder for extra robustness
// This ensures that any requests to /css/ are handled correctly
app.use('/css', express.static(path.join(__dirname, '../frontend/css')));

// Serve specific static content like uploaded images/files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- Your API routes ---
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/customer', customerUserRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/orders', orderRoutes); // Add this to handle order creation and user orders

// CRITICAL FIX: The order routes must be mounted at the same path as the frontend request.
// The frontend makes a request to `/api/admin/orders`.
// Therefore, the backend must listen for requests at that path.
app.use('/api/admin/orders', orderRoutes);


// Optional: Specific routes for your main HTML files
app.get('/adminCustomers.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/adminCustomers.html'));
});

// For your root path (e.g., when someone visits http://localhost:5000/)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/login-choice.html'));
});

// --- Mongoose connection and server start ---
const MONGO_URI = process.env.MONGODB_URI;

if (!MONGO_URI) {
    console.error('FATAL ERROR: MONGODB_URI is not defined in your .env file.');
    process.exit(1);
}

mongoose.connect(MONGO_URI)
    .then(() => {
        const PORT = process.env.PORT || 5000;
        app.listen(PORT, '0.0.0.0', () => console.log(`Server running on http://localhost:${PORT}`));
    })
    .catch(err => {
        console.error('Database connection error:', err);
        process.exit(1);
    });

// Global error handling middleware
app.use((err, req, res, next) => {
    console.error('Global error handler:', err.stack);
    res.status(err.status || 500).json({
        message: err.message || 'Internal Server Error',
    });
});
