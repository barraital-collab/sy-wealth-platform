/**
 * Statistics Routes
 */

const express = require('express');
const { getConnection } = require('../config/database');

const router = express.Router();

// GET Public Statistics
router.get('/', async (req, res) => {
    try {
        const connection = getConnection();

        // Get active users count
        const activeUsers = connection.get(
            "SELECT COUNT(*) as count FROM users WHERE role = 'user' AND status = 'active'"
        );

        // Get total investments
        const totalInvestments = connection.get(
            "SELECT COALESCE(SUM(amount), 0) as total FROM investments WHERE status IN ('active', 'completed')"
        );

        // Get total gains distributed
        const totalGains = connection.get(
            "SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'earnings'"
        );

        res.json({
            success: true,
            activeUsers: activeUsers.count,
            totalInvestments: totalInvestments.total,
            totalGains: totalGains.total
        });
    } catch (error) {
        console.error('Statistics error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch statistics'
        });
    }
});

module.exports = router;
