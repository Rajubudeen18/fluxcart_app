
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "your_jwt_refresh_secret_key";

// JWT Access Token generator
const generateToken = (user) => {
    return jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
};

// JWT Refresh Token generator
const generateRefreshToken = (user) => {
    return jwt.sign({ id: user._id, role: user.role }, JWT_REFRESH_SECRET, { expiresIn: '7d' });
};

// Register
exports.register = asyncHandler(async (req, res) => {
    const { firstName, lastName, email, password, role = 'customer' } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
        res.status(400);
        throw new Error('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({ firstName, lastName, email, password: hashedPassword, role, status: 'active' });
    await user.save();

    // After successful registration, generate and return tokens
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    // Save refresh token in user document
    user.refreshToken = refreshToken;
    await user.save();

    res.status(201).json({ 
        message: 'User registered successfully',
        token,
        refreshToken,
        user: {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
        }
    });
});

// Login helper function
const loginUser = asyncHandler(async (email, password, allowedRoles) => {
    const user = await User.findOne({ email });
    if (!user) {
        // Throw a generic error to avoid user enumeration
        throw new Error('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        throw new Error('Invalid email or password');
    }

    // Ensure allowedRoles is an array for consistent checking
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    // Check if the user's role is one of the allowed roles
    if (!roles.includes(user.role)) {
        throw new Error('Access denied. Your account does not have the required role.');
    }

    if (user.status === 'blocked') {
        throw new Error('Your account is blocked. Please contact support.');
    }

    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    // Save refresh token in user document
    user.refreshToken = refreshToken;
    await user.save();

    return {
        token,
        refreshToken,
        user: {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            email: user.email
        }
    };
});

// Admin login
exports.loginAdmin = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const result = await loginUser(email, password, 'admin');
    res.json(result);
});

// Customer login
exports.loginCustomer = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const result = await loginUser(email, password, ['customer', 'user']);
    res.json(result);
});

// Refresh token handler
exports.refreshToken = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    console.log('Received refresh token:', refreshToken);

    if (!refreshToken) {
        res.status(401);
        throw new Error('Refresh token required');
    }

    // Verify refresh token
    let decoded;
    try {
        decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    } catch (error) {
        console.error('Refresh token verification error:', error);
        res.status(401);
        throw new Error('Invalid refresh token');
    }

    // Find user and check if refresh token matches
    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== refreshToken) {
        console.error('Refresh token does not match user record');
        res.status(401);
        throw new Error('Invalid refresh token');
    }

    // Generate new access token
    const newToken = generateToken(user);

    res.json({ token: newToken });
});
