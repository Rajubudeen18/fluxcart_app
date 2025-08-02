const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, unique: true, required: true }, // Added required: true for email
    password: { type: String, required: true },           // Added required: true for password
    phone: { type: String }, // Phone number field
    address: { type: String }, // Address field
    role: { type: String, default: 'user' }, // 'user' for customer, 'admin' for admin
    status: { type: String, default: 'Active' }, // 'Active', 'Blocked'. Default to 'Active'.
    refreshToken: { type: String }, // Added refreshToken field to store refresh tokens
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});


// Update updated_at on save
userSchema.pre('save', function(next) {
    this.updated_at = Date.now();
    next();
});

userSchema.pre('findOneAndUpdate', function(next) {
    this._update.updated_at = Date.now();
    next();
});


module.exports = mongoose.model('User', userSchema);