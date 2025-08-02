const User = require('../models/User');
const Order = require('../models/Order'); // Order model-aiyum use panna vendum
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// ------------------------------------
// Admin-Facing Functions
// ------------------------------------

/**
 * @desc    Get all customers with search, status filters
 * @route   GET /api/customers
 * @access  Admin
 */
exports.getAllCustomers = asyncHandler(async (req, res) => {
    const { search, status } = req.query;
    // CRITICAL FIX: To handle both 'customer' and 'user' roles
    let query = { $or: [{ role: 'customer' }, { role: 'user' }] };

    if (search) {
        query.$or = [
            { firstName: { $regex: search, $options: 'i' } },
            { lastName: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
        ];
    }

    // Status filter should apply to both user roles
    if (status && (status === 'active' || status === 'blocked')) {
        query.status = status;
    }

    const customers = await User.find(query).select('-password');
    
    // For each customer, if phone or address is not set, try to get it from their most recent order
    const customersWithAddress = await Promise.all(customers.map(async (customer) => {
        // Convert to plain object to avoid mongoose document methods
        const customerObj = customer.toObject();
        
        // If phone or address is not set, try to get it from the most recent order
        if (!customerObj.phone || !customerObj.address) {
            const latestOrder = await Order.findOne({ customer: customer._id })
                .sort({ orderDate: -1 })
                .select('shippingAddress');
                
            if (latestOrder && latestOrder.shippingAddress) {
                // Always use phone from most recent order if available
                if (latestOrder.shippingAddress.phone) {
                    customerObj.phone = latestOrder.shippingAddress.phone;
                }
                
                // If customer doesn't have address, create address string from order
                if (!customerObj.address) {
                    const addressParts = [];
                    if (latestOrder.shippingAddress.addressLine1) {
                        addressParts.push(latestOrder.shippingAddress.addressLine1);
                    }
                    if (latestOrder.shippingAddress.addressLine2) {
                        addressParts.push(latestOrder.shippingAddress.addressLine2);
                    }
                    if (latestOrder.shippingAddress.city) {
                        addressParts.push(latestOrder.shippingAddress.city);
                    }
                    if (latestOrder.shippingAddress.state) {
                        addressParts.push(latestOrder.shippingAddress.state);
                    }
                    if (latestOrder.shippingAddress.zipCode) {
                        addressParts.push(latestOrder.shippingAddress.zipCode);
                    }
                    if (latestOrder.shippingAddress.country) {
                        addressParts.push(latestOrder.shippingAddress.country);
                    }
                    
                    if (addressParts.length > 0) {
                        customerObj.address = addressParts.join(', ');
                    }
                }
            }
        }
        
        return customerObj;
    }));
    
    res.json(customersWithAddress);
});

/**
 * @desc    Get a single customer by ID
 * @route   GET /api/customers/:id
 * @access  Admin
 */
exports.getCustomerById = asyncHandler(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        res.status(400);
        throw new Error('Invalid customer ID format.');
    }

    const customer = await User.findOne({
        _id: req.params.id,
        $or: [{ role: 'customer' }, { role: 'user' }]
    }).select('-password');
    if (!customer) {
        res.status(404);
        throw new Error('Customer not found');
    }
    
    // Convert to plain object to avoid mongoose document methods
    const customerObj = customer.toObject();
    
    // If phone or address is not set, try to get it from the most recent order
    if (!customerObj.phone || !customerObj.address) {
        const latestOrder = await Order.findOne({ customer: customer._id })
            .sort({ orderDate: -1 })
            .select('shippingAddress');
            
        if (latestOrder && latestOrder.shippingAddress) {
            // Always use phone from most recent order if available
            if (latestOrder.shippingAddress.phone) {
                customerObj.phone = latestOrder.shippingAddress.phone;
            }
            
            // If customer doesn't have address, create address string from order
            if (!customerObj.address) {
                const addressParts = [];
                if (latestOrder.shippingAddress.addressLine1) {
                    addressParts.push(latestOrder.shippingAddress.addressLine1);
                }
                if (latestOrder.shippingAddress.addressLine2) {
                    addressParts.push(latestOrder.shippingAddress.addressLine2);
                }
                if (latestOrder.shippingAddress.city) {
                    addressParts.push(latestOrder.shippingAddress.city);
                }
                if (latestOrder.shippingAddress.state) {
                    addressParts.push(latestOrder.shippingAddress.state);
                }
                if (latestOrder.shippingAddress.zipCode) {
                    addressParts.push(latestOrder.shippingAddress.zipCode);
                }
                if (latestOrder.shippingAddress.country) {
                    addressParts.push(latestOrder.shippingAddress.country);
                }
                
                if (addressParts.length > 0) {
                    customerObj.address = addressParts.join(', ');
                }
            }
        }
    }
    
    res.json(customerObj);
});

/**
 * @desc    Update a customer's details (admin perspective)
 * @route   PUT /api/customers/:id
 * @access  Admin
 */
exports.updateCustomer = asyncHandler(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        res.status(400);
        throw new Error('Invalid customer ID format.');
    }

    const { firstName, lastName, email, phone, address, status } = req.body;
    const updateFields = {};

    if (firstName) updateFields.firstName = firstName;
    if (lastName) updateFields.lastName = lastName;
    if (email) updateFields.email = email;
    if (phone) updateFields.phone = phone;
    if (address) updateFields.address = address;
    if (status && ['active', 'blocked'].includes(status)) {
        updateFields.status = status;
    }

    if (Object.keys(updateFields).length === 0) {
        res.status(400);
        throw new Error('No valid fields provided for update.');
    }

    const updatedCustomer = await User.findOneAndUpdate(
        { _id: req.params.id, $or: [{ role: 'customer' }, { role: 'user' }] },
        { $set: updateFields },
        { new: true, runValidators: true }
    ).select('-password');

    if (!updatedCustomer) {
        res.status(404);
        throw new Error('Customer not found.');
    }
    
    // Convert to plain object to avoid mongoose document methods
    const customerObj = updatedCustomer.toObject();
    
    // If phone or address is not set, try to get it from the most recent order
    if (!customerObj.phone || !customerObj.address) {
        const latestOrder = await Order.findOne({ customer: updatedCustomer._id })
            .sort({ orderDate: -1 })
            .select('shippingAddress');
            
        if (latestOrder && latestOrder.shippingAddress) {
            // Always use phone from most recent order if available
            if (latestOrder.shippingAddress.phone) {
                customerObj.phone = latestOrder.shippingAddress.phone;
            }
            
            // If customer doesn't have address, create address string from order
            if (!customerObj.address) {
                const addressParts = [];
                if (latestOrder.shippingAddress.addressLine1) {
                    addressParts.push(latestOrder.shippingAddress.addressLine1);
                }
                if (latestOrder.shippingAddress.addressLine2) {
                    addressParts.push(latestOrder.shippingAddress.addressLine2);
                }
                if (latestOrder.shippingAddress.city) {
                    addressParts.push(latestOrder.shippingAddress.city);
                }
                if (latestOrder.shippingAddress.state) {
                    addressParts.push(latestOrder.shippingAddress.state);
                }
                if (latestOrder.shippingAddress.zipCode) {
                    addressParts.push(latestOrder.shippingAddress.zipCode);
                }
                if (latestOrder.shippingAddress.country) {
                    addressParts.push(latestOrder.shippingAddress.country);
                }
                
                if (addressParts.length > 0) {
                    customerObj.address = addressParts.join(', ');
                }
            }
        }
    }
    
    res.json(customerObj);
});

/**
 * @desc    Delete a customer
 * @route   DELETE /api/customers/:id
 * @access  Admin
 */
exports.deleteCustomer = asyncHandler(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        res.status(400);
        throw new Error('Invalid customer ID format.');
    }

    const deletedCustomer = await User.findOneAndDelete({
        _id: req.params.id, $or: [{ role: 'customer' }, { role: 'user' }]
    });
    if (!deletedCustomer) {
        res.status(404);
        throw new Error('Customer not found.');
    }
    res.json({ message: 'Customer deleted successfully' });
});

/**
 * @desc    Reset a customer's password (admin action)
 * @route   PUT /api/customers/:id/reset-password
 * @access  Admin
 */
exports.resetCustomerPassword = asyncHandler(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        res.status(400);
        throw new Error('Invalid customer ID format.');
    }

    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
        res.status(400);
        throw new Error('New password must be at least 6 characters long.');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const customer = await User.findOneAndUpdate(
        { _id: req.params.id, $or: [{ role: 'customer' }, { role: 'user' }] },
        { password: hashedPassword },
        { new: true, runValidators: true }
    );

    if (!customer) {
        res.status(404);
        throw new Error('Customer not found.');
    }
    res.json({ message: 'Customer password reset successfully.' });
});

/**
 * @desc    Impersonate a customer (admin action)
 * @route   POST /api/customers/:id/impersonate
 * @access  Admin
 */
exports.impersonateCustomer = asyncHandler(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        res.status(400);
        throw new Error('Invalid customer ID format.');
        return;
    }

    const customer = await User.findOne({
        _id: req.params.id,
        $or: [{ role: 'customer' }, { role: 'user' }]
    });
    if (!customer) {
        res.status(404);
        throw new Error('Customer not found.');
        return;
    }

    const customerPayload = {
        id: customer._id,
        role: 'customer',
        isImpersonating: true,
        impersonatedByAdminId: req.user._id, // Assumes a middleware sets req.user for the admin
        impersonatedCustomerName: `${customer.firstName} ${customer.lastName}`
    };
    const impersonationToken = jwt.sign(customerPayload, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ message: 'Impersonation successful', token: impersonationToken });
});

// ------------------------------------
// Customer-Facing Functions
// ------------------------------------

/**
 * @desc    Get a user's own profile
 * @route   GET /api/customers/profile
 * @access  Customer
 */
exports.getCustomerProfile = asyncHandler(async (req, res) => {
    const user = req.user;
    if (user) {
        res.json(user);
    } else {
        res.status(404).json({ message: 'User not found.' });
    }
});

/**
 * @desc    Update a user's own profile
 * @route   PUT /api/customers/profile
 * @access  Customer
 */
exports.updateCustomerProfile = asyncHandler(async (req, res) => {
    const { firstName, lastName } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId);

    if (!user) {
        res.status(404);
        throw new Error('User not found.');
    }

    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;

    const updatedUser = await user.save();

    res.json({
        _id: updatedUser._id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email
    });
});

/**
 * @desc    Change a user's password
 * @route   PUT /api/customers/change-password
 * @access  Customer
 */
exports.changeCustomerPassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id); // Fetch full user doc to get password

    if (!user) {
        res.status(404);
        throw new Error('User not found.');
    }

    if (!(await bcrypt.compare(currentPassword, user.password))) {
        res.status(401);
        throw new Error('Invalid current password.');
    }

    if (!newPassword || newPassword.length < 6) {
        res.status(400);
        throw new Error('New password must be at least 6 characters long.');
    }

    user.password = await bcrypt.hash(newPassword, 10); // Hash the new password
    await user.save();

    res.json({ message: 'Password updated successfully.' });
});

/**
 * @desc    Get a user's orders
 * @route   GET /api/customers/orders
 * @access  Customer
 */
exports.getCustomerOrders = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const orders = await Order.find({ customer: userId })
        .populate('products.product', 'name image') // Populate product details
        .sort({ orderDate: -1 });

    if (orders) {
        res.json(orders);
    } else {
        res.status(404).json({ message: 'No orders found for this user.' });
    }
});
