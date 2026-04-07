/**
 * Authentication Middleware
 */

const jwt = require('jsonwebtoken');
const { getConnection } = require('../config/database');

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Access token required'
        });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired token'
            });
        }

        const connection = getConnection();
        const dbUser = connection.get('SELECT status FROM users WHERE id = ?', [user.id]);
        if (!dbUser) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        if (dbUser.status !== 'active') {
            return res.status(403).json({
                success: false,
                message: `Account is ${dbUser.status}`
            });
        }

        req.user = user;
        next();
    });
}

function requireAdmin(req, res, next) {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Admin access required'
        });
    }
    next();
}

module.exports = { authenticateToken, requireAdmin };
