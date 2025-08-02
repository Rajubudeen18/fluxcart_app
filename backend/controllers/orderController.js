const asyncHandler = require('express-async-handler');
const Order = require('../models/Order'); // Assuming you have an Order model
const User = require('../models/User'); // Import User model for customer filtering
const mongoose = require('mongoose');
const createOrder = asyncHandler(async (req, res) => {
    const {
        orderItems,
        shippingAddress,
        paymentMethod,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
    } = req.body; // These fields are from the frontend `handlePlaceOrder`

    if (!req.body.orderItems || req.body.orderItems.length === 0) {
        res.status(400);
        throw new Error('No order items');
    }

    const order = new Order({
        customer: req.user.id, // from verifyToken middleware
        products: req.body.orderItems,
        shippingAddress,
        billingAddress: shippingAddress, // Assuming billing same as shipping
        totalAmount: totalPrice,
        status: 'pending',
        isPaid: false,
        orderDate: Date.now()
    });

    const createdOrder = await order.save();
    res.status(201).json(createdOrder);
});

const getOrderById = asyncHandler(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        res.status(400);
        throw new Error('Invalid Order ID');
    }

    const order = await Order.findById(req.params.id).populate('customer', 'firstName lastName email');

    if (order) {
        // Ensure the user is an admin or the owner of the order
        if (req.user.role === 'admin' || order.customer._id.toString() === req.user.id) {
            res.json(order);
        } else {
            res.status(403);
            throw new Error('Not authorized to view this order');
        }
    } else {
        res.status(404);
        throw new Error('Order not found');
    }
});

const updateOrderToPaid = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);

    if (order) {
        order.isPaid = true;
        order.paidAt = Date.now();
        order.paymentResult = { // Example data from a payment provider like PayPal
            id: req.body.id,
            status: req.body.status,
            update_time: req.body.update_time,
            email_address: req.body.payer.email_address,
        };
        const updatedOrder = await order.save();
        res.json(updatedOrder);
    } else {
        res.status(404);
        throw new Error('Order not found');
    }
});

const updateOrderToDelivered = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);

    if (order) {
        order.isDelivered = true;
        order.deliveredAt = Date.now();
        const updatedOrder = await order.save();
        res.json(updatedOrder);
    } else {
        res.status(404);
        throw new Error('Order not found');
    }
});

const getMyOrders = asyncHandler(async (req, res) => {
    // FIX: The Order model uses 'customer', not 'user'.
    const orders = await Order.find({ customer: req.user.id });
    res.json(orders);
});

const getAllOrders = asyncHandler(async (req, res) => {
    const pageSize = 10;
    const page = Number(req.query.pageNumber) || 1;
    
    // Extract filter parameters
    const { status, customer, dateFrom, dateTo } = req.query;
    
    // Build filter object
    let filter = {};
    
    // Filter by status
    if (status && status !== 'all') {
        filter.status = status;
    }
    
    // Filter by customer (search by name or email)
    if (customer) {
        // Find customers matching the search term
        const customers = await User.find({
            $or: [
                { firstName: { $regex: customer, $options: 'i' } },
                { lastName: { $regex: customer, $options: 'i' } },
                { email: { $regex: customer, $options: 'i' } }
            ]
        });
        
        const customerIds = customers.map(c => c._id);
        filter.customer = { $in: customerIds };
    }
    
    // Filter by date range
    if (dateFrom || dateTo) {
        filter.orderDate = {};
        if (dateFrom) {
            // Convert DD-MM-YYYY to YYYY-MM-DD format for proper date parsing
            // Check if date is already in YYYY-MM-DD format (from HTML date input)
            let formattedDateFrom = dateFrom;
            if (dateFrom.includes('-') && dateFrom.split('-')[0].length <= 2) {
                // It's in DD-MM-YYYY format, convert to YYYY-MM-DD
                const [day, month, year] = dateFrom.split('-');
                formattedDateFrom = `${year}-${month}-${day}`;
            }
            // Create date at the beginning of the day (00:00:00) in local time
            const dateFromObj = new Date(formattedDateFrom);
            dateFromObj.setHours(0, 0, 0, 0);
            filter.orderDate.$gte = dateFromObj;
        }
        if (dateTo) {
            // Convert DD-MM-YYYY to YYYY-MM-DD format for proper date parsing
            // Check if date is already in YYYY-MM-DD format (from HTML date input)
            let formattedDateTo = dateTo;
            if (dateTo.includes('-') && dateTo.split('-')[0].length <= 2) {
                // It's in DD-MM-YYYY format, convert to YYYY-MM-DD
                const [day, month, year] = dateTo.split('-');
                formattedDateTo = `${year}-${month}-${day}`;
            }
            // Create date at the end of the day (23:59:59) in local time
            const dateToObj = new Date(formattedDateTo);
            dateToObj.setHours(23, 59, 59, 999);
            filter.orderDate.$lte = dateToObj;
        }
    }
    
    const count = await Order.countDocuments(filter);
    
    // Fetch orders with filters
    const orders = await Order.find(filter)
        .populate('customer', 'id firstName lastName email')
        .limit(pageSize)
        .skip(pageSize * (page - 1))
        .sort({ createdAt: -1 });

    res.json({
        orders,
        page,
        pages: Math.ceil(count / pageSize),
    });
});

const updateOrderStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;
    const orderId = req.params.id;

    if (!status) {
        res.status(400);
        throw new Error('Status is required');
    }

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
        res.status(400);
        throw new Error('Invalid Order ID');
    }

    const order = await Order.findById(orderId);

    if (!order) {
        res.status(404);
        throw new Error('Order not found');
    }

    order.status = status;

    // Optionally update isDelivered flag if status is delivered
    if (status === 'delivered') {
        order.isDelivered = true;
        order.deliveredAt = Date.now();
    } else {
        order.isDelivered = false;
        order.deliveredAt = null;
    }

    const updatedOrder = await order.save();
    res.json(updatedOrder);
});

// New controller method to delete order by admin
const deleteOrder = asyncHandler(async (req, res) => {
    const orderId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
        res.status(400);
        throw new Error('Invalid Order ID');
    }

    const order = await Order.findById(orderId);

    if (!order) {
        res.status(404);
        throw new Error('Order not found');
    }

    // FIX: .remove() is deprecated. Use .deleteOne() instead.
    await order.deleteOne();
    res.json({ message: 'Order deleted successfully' });
});

module.exports = {
    createOrder,
    getOrderById,
    updateOrderToPaid,
    updateOrderToDelivered,
    getMyOrders,
    getAllOrders,
    updateOrderStatus,
    deleteOrder,
};
