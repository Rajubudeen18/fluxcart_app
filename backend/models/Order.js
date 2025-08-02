const mongoose = require('mongoose');

// Define the schema for an Order
const orderSchema = new mongoose.Schema({
    // Reference to the customer who placed the order
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User' // Assuming your customer model is named 'User'
    },
    // Array of products in the order
    products: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                required: true,
                ref: 'Product' // Assuming your product model is named 'Product'
            },
            name: {
                type: String,
                required: true
            },
            quantity: {
                type: Number,
                required: true,
                min: 1
            },
            priceAtOrder: { // The price at the time the order was placed
                type: Number,
                required: true,
                min: 0
            }
        }
    ],
    // Total amount for the entire order
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    // The current status of the order
    status: {
        type: String,
        required: true,
        enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending'
    },
    // Shipping and billing addresses
    shippingAddress: {
        addressLine1: String,
        addressLine2: String,
        city: String,
        state: String,
        zipCode: String,
        country: String,
        phone: String,
    },
    billingAddress: {
        addressLine1: String,
        addressLine2: String,
        city: String,
        state: String,
        zipCode: String,
        country: String,
    },
    // Payment details
    isPaid: {
        type: Boolean,
        default: false
    },
    paidAt: {
        type: Date
    },
    // ADDED: Delivery details to match controller logic
    isDelivered: {
        type: Boolean,
        default: false
    },
    deliveredAt: {
        type: Date
    },
    // Timestamps
    orderDate: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
