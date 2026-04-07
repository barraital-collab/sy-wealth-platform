/**
 * Authentication Routes
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const validator = require('validator');
const { getConnection } = require('../config/database');

const router = express.Router();

// Email transporter (created once)
let emailTransporter = null;
function getEmailTransporter() {
    if (!emailTransporter && process.env.ADMIN_EMAIL && process.env.ADMIN_EMAIL_PASS) {
        emailTransporter = nodemailer.createTransporter({
            service: 'gmail',
            auth: {
                user: process.env.ADMIN_EMAIL,
                pass: process.env.ADMIN_EMAIL_PASS
            }
        });
    }
    return emailTransporter;
}

async function notifyAdminNewSignup(name, phone, userId, referralCode, req) {
    const connection = getConnection();
    
    // 1. Console notification (always)
    const refInfo = referralCode ? ` (REF: ${referralCode})` : '';
    console.log(`🔔 NEW USER SIGNUP! 👤 ${name} 📱 ${phone} ID: ${userId}${refInfo} IP: ${req.ip || 'unknown'}`);
    
    try {
        // 2. Get admin email
        const admin = connection.get('SELECT email FROM users WHERE role = "admin" LIMIT 1');
        
        if (admin?.email) {
            // 3. Email notification if configured
            const transporter = getEmailTransporter();
            if (transporter) {
                await transporter.sendMail({
                    from: `"SY Wealth" <${process.env.ADMIN_EMAIL}>`,
                    to: admin.email,
                    subject: `🔔 NOUVELLE INSCRIPTION - ${name}`,
                    html: `
                        <h2>Nouvel utilisateur inscrit !</h2>
                        <p><strong>Nom:</strong> ${name}</p>
                        <p><strong>Téléphone:</strong> ${phone}</p>
                        <p><strong>ID:</strong> ${userId}</p>
                        <p><strong>Code parrainage:</strong> ${referralCode || 'Aucun'}</p>
                        <p><strong>IP:</strong> ${req.ip || 'unknown'}</p>
                        <hr>
                        <p><a href="${req.get('origin') || 'http://localhost:3000'}/admin.html">Admin Panel</a></p>
                    `
                });
                console.log(`📧 Email envoyé à admin: ${admin.email}`);
            } else {
                console.log('⚠️  Email config manquante (.env ADMIN_EMAIL/PASS)');
            }
        } else {
            console.log('⚠️  Admin sans email dans DB');
        }
    } catch (emailError) {
        console.error('❌ Email notification failed:', emailError.message);
    }
}

// SIGNUP
router.post('/signup', async (req, res) => {
    try {
        const { name, phone, password, referralCode } = req.body;

        // Validation
        if (!name || !phone || !password) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters'
            });
        }

        // Simple phone validation for various formats
        const cleanPhone = phone.replace(/\s/g, '');
        if (!/^(\+221|0)\d{8,}$/.test(cleanPhone) && !/^\d{9,}$/.test(cleanPhone)) {
            return res.status(400).json({
                success: false,
                message: 'Le numéro doit avoir au moins 9 chiffres'
            });
        }

        const connection = getConnection();
        const existingUser = connection.get(
            'SELECT id FROM users WHERE phone = ?',
            [cleanPhone]
        );

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Phone number already registered'
            });
        }

        let referrerId = null;
        let referrerName = null;
        if (referralCode) {
            const referrer = connection.get(
                'SELECT id, name FROM users WHERE referral_code = ?',
                [referralCode.trim()]
            );
            if (referrer) {
                referrerId = referrer.id;
                referrerName = referrer.name;
            }
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const result = connection.run(
            'INSERT INTO users (name, phone, password, role, balance, referred_by, created_at) VALUES (?, ?, ?, ?, ?, ?, datetime(\'now\'))',
            [name, cleanPhone, hashedPassword, 'user', 0, referrerId]
        );

        const userId = result.insertId;
        const newReferralCode = `SY${userId.toString().padStart(5, '0')}`;
        connection.run(
            'UPDATE users SET referral_code = ? WHERE id = ?',
            [newReferralCode, userId]
        );

        // 🔔 ADMIN NOTIFICATION - NEW!
        await notifyAdminNewSignup(name, cleanPhone, userId, referralCode || null, req);

        if (referrerId) {
            const signupBonus = 25;
            connection.run(
                'UPDATE users SET balance = balance + ? WHERE id = ?',
                [signupBonus, referrerId]
            );
            connection.run(
                'INSERT INTO transactions (user_id, type, amount, status, created_at) VALUES (?, ?, ?, ?, datetime(\'now\'))',
                [referrerId, 'referral_signup', signupBonus, 'completed']
            );
        }

        // Create token
        const token = jwt.sign(
            { id: userId, phone, role: 'user', name },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE }
        );

        res.json({
            success: true,
            message: 'Account created successfully',
            token,
            user: {
                id: userId,
                name,
                phone,
                role: 'user'
            },
            referralInfo: referrerId ? {
                referrerName: referrerName,
                bonusGiven: 25,
                message: `25 FCFA ont été crédités au compte de ${referrerName} en bonus de parrainage`
            } : null
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({
            success: false,
            message: 'Signup failed'
        });
    }
});

// LOGIN
router.post('/login', async (req, res) => {
    try {
        const { phone, password } = req.body;

        if (!phone || !password) {
            return res.status(400).json({
                success: false,
                message: 'Phone and password are required'
            });
        }

        const connection = getConnection();
        const cleanPhone = phone.replace(/\s/g, '');
        const user = connection.get(
            'SELECT id, name, phone, password, role, balance FROM users WHERE phone = ?',
            [cleanPhone]
        );

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check password
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check if account is blocked
        const statusCheck = connection.get(
            'SELECT status FROM users WHERE id = ?',
            [user.id]
        );

        if (statusCheck && statusCheck.status !== 'active') {
            return res.status(403).json({
                success: false,
                message: 'Account is ' + statusCheck.status,
                status: statusCheck.status
            });
        }

        // Get latest announcements
        const announcements = connection.all(
            'SELECT id, title, content, created_at FROM announcements ORDER BY created_at DESC LIMIT 5'
        );

        // Create token
        const token = jwt.sign(
            {
                id: user.id,
                phone: user.phone,
                role: user.role,
                name: user.name
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE }
        );

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                phone: user.phone,
                role: user.role
            },
            announcements: announcements
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed'
        });
    }
});

// VERIFY TOKEN
router.post('/verify', (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.json({ success: false });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.json({ success: false });
        }
        res.json({
            success: true,
            user
        });
    });
});

module.exports = router;
