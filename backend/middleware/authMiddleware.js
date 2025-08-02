const jwt = require('jsonwebtoken');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');

// This middleware verifies the JWT and attaches the user to the request object.
const verifyToken = asyncHandler(async (req, res, next) => {
    // Check if the authorization header exists and starts with 'Bearer'
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get the token from the header by splitting the "Bearer " part
            const token = req.headers.authorization.split(' ')[1];

            // Verify the token using the secret key
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Find the user associated with the token's ID, excluding the password field
            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                res.status(401);
                throw new Error('Not authorized, user not found');
            }

            // If the token is valid and the user is found, proceed to the next middleware
            next();
        } catch (error) {
            console.error(error);
            res.status(401);
            throw new Error('Not authorized, token failed');
        }
    } else {
        // If no token is provided in the header, return an error
        res.status(401);
        throw new Error('Not authorized, no token');
    }
});

// This middleware checks if the user has an 'admin' role.
const isAdmin = (req, res, next) => {
    // This should run after verifyToken, so req.user should be populated.
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403); // 403 Forbidden for role-based access control
        throw new Error('Not authorized as an admin');
    }
};

const isCustomer = (req, res, next) => {
    // This should run after verifyToken, so req.user should be populated.
    // It allows both 'customer' and 'user' roles to access customer routes,
    // matching the logic in the login controller.
    if (req.user && (req.user.role === 'customer' || req.user.role === 'user')) {
        next();
    } else {
        res.status(403); // 403 Forbidden for role-based access control
        throw new Error('Not authorized as a customer');
    }
};

module.exports = { verifyToken, isAdmin, isCustomer };
