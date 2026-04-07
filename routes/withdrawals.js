/**
 * Withdrawals Routes
 */

const express = require('express');
const { getConnection } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// CREATE Withdrawal Request
router.post('/create', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { amount, method, phone } = req.body;

        if (!amount || !method || !phone) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Check minimum withdrawal amount (3000 FCFA)
        if (parseFloat(amount) < 3000) {
            return res.status(400).json({
                success: false,
                message: 'Le montant minimum de retrait est de 3000 FCFA'
            });
        }

        const connection = getConnection();

        // Check user balance
        const user = connection.get(
            'SELECT balance FROM users WHERE id = ?',
            [userId]
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (user.balance < amount) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient balance'
            });
        }

        // Check withdrawal time restrictions (Monday-Thursday, 10h-17h)
        const now = new Date();
        const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
        const hour = now.getHours();

        // Monday = 1, Tuesday = 2, Wednesday = 3, Thursday = 4
        if (dayOfWeek < 1 || dayOfWeek > 4) {
            return res.status(400).json({
                success: false,
                message: 'Les retraits sont autorisés uniquement du lundi au jeudi'
            });
        }

        // 10h to 17h (17:59)
        if (hour < 10 || hour >= 17) {
            return res.status(400).json({
                success: false,
                message: 'Les retraits sont autorisés uniquement de 10h à 17h'
            });
        }

        // Check for daily withdrawal limit (1 per day)
        const today = now.toISOString().split('T')[0]; // YYYY-MM-DD format
        const todayWithdrawals = connection.get(
            `SELECT COUNT(*) as count FROM withdrawals
             WHERE user_id = ? AND DATE(created_at) = ? AND status IN ('pending', 'approved')`,
            [userId, today]
        );

        if (todayWithdrawals.count >= 1) {
            return res.status(400).json({
                success: false,
                message: 'Vous ne pouvez effectuer qu\'un seul retrait par jour'
            });
        }

        // Check for pending withdrawals (prevent double withdrawal)
        const pendingWithdrawals = connection.get(
            "SELECT COUNT(*) as count FROM withdrawals WHERE user_id = ? AND status = 'pending'",
            [userId]
        );

        if (pendingWithdrawals.count > 0) {
            return res.status(400).json({
                success: false,
                message: 'You have a pending withdrawal request'
            });
        }

        // Create withdrawal request
        const result = connection.run(
            `INSERT INTO withdrawals
             (user_id, amount, method, phone, status, created_at)
             VALUES (?, ?, ?, ?, 'pending', datetime('now'))`,
            [userId, amount, method, phone]
        );

        res.json({
            success: true,
            message: 'Withdrawal request created successfully',
            withdrawalId: result.insertId
        });
    } catch (error) {
        console.error('Withdrawal creation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create withdrawal request'
        });
    }
});

// GET User Withdrawals
router.get('/mywithdrawals', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const connection = getConnection();

        const withdrawals = connection.all(
            `SELECT id, amount, method, phone, status, created_at
             FROM withdrawals
             WHERE user_id = ?
             ORDER BY created_at DESC`,
            [userId]
        );

        res.json({
            success: true,
            withdrawals
        });
    } catch (error) {
        console.error('Error fetching withdrawals:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch withdrawals'
        });
    }
});

module.exports = router;
