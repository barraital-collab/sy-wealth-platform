/**
 * Deposits Routes
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const { getConnection } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// CREATE Deposit Request
router.post('/create', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { amount, method, senderPhone, receipt } = req.body;

        if (!amount || !method || !senderPhone || !receipt) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        const connection = getConnection();

        // Save receipt image
        const uploadDir = path.join(__dirname, '../public/uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const fileName = `deposit_${userId}_${Date.now()}.png`;
        const filePath = path.join(uploadDir, fileName);

        const base64Data = receipt.replace(/^data:image\/\w+;base64,/, '');
        fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));

        // Create deposit request
        const result = connection.run(
            `INSERT INTO deposits
             (user_id, amount, method, sender_phone, receipt_path, status, created_at)
             VALUES (?, ?, ?, ?, ?, 'pending', datetime('now'))`,
            [userId, amount, method, senderPhone, fileName]
        );

        res.json({
            success: true,
            message: 'Deposit request created successfully',
            depositId: result.insertId
        });
    } catch (error) {
        console.error('Deposit creation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create deposit request'
        });
    }
});

// GET User Deposits
router.get('/mydeposits', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const connection = getConnection();

        const deposits = connection.all(
            `SELECT id, amount, method, status, created_at
             FROM deposits
             WHERE user_id = ?
             ORDER BY created_at DESC`,
            [userId]
        );

        res.json({
            success: true,
            deposits
        });
    } catch (error) {
        console.error('Error fetching deposits:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch deposits'
        });
    }
});

module.exports = router;
