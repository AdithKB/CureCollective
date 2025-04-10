const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            throw new Error('No token provided');
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mycare_secret_key');
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user) {
            throw new Error('User not found');
        }
        
        req.token = token;
        req.user = user;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({ 
            success: false,
            error: 'Please authenticate' 
        });
    }
};

module.exports = auth; 