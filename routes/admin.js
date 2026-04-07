/**
 * Admin Routes
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const { getConnection } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET recent signups
router.get('/recent-signups', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const connection = getConnection();
        const recentSignups = connection.all(`
            SELECT id, name, phone, created_at, referral_code
            FROM users 
            WHERE role = 'user' 
            AND created_at >= datetime('now', '-24 hours')
            ORDER BY created_at DESC
        `);

        res.json({
            success: true,
            recentSignups,
            count: recentSignups.length
        });
    } catch (error) {
        console.error('Recent signups error:', error);
        res.status(500).json({ success: false, message: 'Error fetching recent signups' });
    }
});

// DASHBOARD
router.get('/dashboard', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const connection = getConnection();

        const totalUsers = connection.get('SELECT COUNT(*) as count FROM users WHERE role != ?', ['admin']).count;
        const pendingDeposits = connection.get('SELECT COUNT(*) as count FROM deposits WHERE status = ?', ['pending']).count;
        const pendingWithdrawals = connection.get('SELECT COUNT(*) as count FROM withdrawals WHERE status = ?', ['pending']).count;
        const dailyProfit = connection.get('SELECT COALESCE(SUM(amount), 0) as profit FROM transactions WHERE type = ? AND created_at >= datetime(\'now\', \'-1 day\')', ['earnings']).profit;

        const users = connection.all('SELECT id, name, phone, balance, status, created_at FROM users WHERE role != ? ORDER BY created_at DESC LIMIT 50', ['admin']);
        const projects = connection.all('SELECT * FROM projects WHERE active = 1 ORDER BY id');
        const deposits = connection.all('SELECT d.*, u.name as userName FROM deposits d JOIN users u ON d.user_id = u.id WHERE d.status = ? ORDER BY d.created_at DESC LIMIT 10', ['pending']);
        const withdrawals = connection.all('SELECT w.*, u.name as userName FROM withdrawals w JOIN users u ON w.user_id = u.id WHERE w.status = ? ORDER BY w.created_at DESC LIMIT 10', ['pending']);
        const announcements = connection.all('SELECT * FROM announcements ORDER BY created_at DESC LIMIT 10');

        res.json({
            success: true,
            totalUsers,
            pendingDeposits,
            pendingWithdrawals,
            dailyProfit,
            users,
            projects,
            deposits,
            withdrawals,
            announcements
        });

    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ success: false, message: 'Dashboard load failed' });
    }
});

// DELETE PROJECT
async function handleProjectDelete(req, res) {
    try {
        const projectId = req.params.id;
        const connection = getConnection();

        const project = connection.get(
            'SELECT id, name FROM projects WHERE id = ?',
            [projectId]
        );

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Produit introuvable'
            });
        }

        const investments = connection.get(
            'SELECT COUNT(*) as count FROM investments WHERE project_id = ?',
            [projectId]
        );

        if (investments.count > 0) {
            return res.status(400).json({
                success: false,
                message: `Impossible de supprimer: ${investments.count} investissement(s)`
            });
        }

        connection.run(
            'DELETE FROM projects WHERE id = ?',
            [projectId]
        );

        res.json({
            success: true,
            message: 'Produit supprimé avec succès'
        });

    } catch (error) {
        console.error('Project deletion error:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur: ' + error.message
        });
    }
}

router.delete('/projects/:id', authenticateToken, requireAdmin, handleProjectDelete);
router.delete('/projects/delete/:id', authenticateToken, requireAdmin, handleProjectDelete);

// DELETE USER
router.delete('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const userId = req.params.id;
        const adminId = req.user.id;

        const connection = getConnection();
        const user = connection.get('SELECT id, role, name FROM users WHERE id = ?', [userId]);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (user.role === 'admin') {
            return res.status(403).json({ success: false, message: 'Cannot delete admin user' });
        }

        if (parseInt(userId) === adminId) {
            return res.status(403).json({ success: false, message: 'Cannot delete yourself' });
        }

        connection.beginTransaction();

        try {
            connection.run('DELETE FROM investments WHERE user_id = ?', [userId]);
            connection.run('DELETE FROM deposits WHERE user_id = ?', [userId]);
            connection.run('DELETE FROM withdrawals WHERE user_id = ?', [userId]);
            connection.run('DELETE FROM transactions WHERE user_id = ?', [userId]);
            connection.run('DELETE FROM user_tasks WHERE user_id = ?', [userId]);

            const result = connection.run('DELETE FROM users WHERE id = ?', [userId]);

            connection.commit();

            if (result.changes > 0) {
                console.log(`Admin ${adminId} deleted user ${userId} (${user.name})`);
                return res.json({ success: true, message: 'User deleted successfully' });
            } else {
                connection.rollback();
                return res.status(404).json({ success: false, message: 'User not found' });
            }

        } catch (error) {
            try {
                connection.rollback();
            } catch (e) {}
            console.error('Delete user error:', error);
            return res.status(500).json({ success: false, message: 'Failed to delete user: ' + error.message });
        }

    } catch (error) {
        console.error('Outer delete error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET USER PROFILE
router.get('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const userId = req.params.id;
        const connection = getConnection();

        const user = connection.get('SELECT id, name, phone, balance, status, created_at FROM users WHERE id = ? AND role != ?', [userId, 'admin']);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({ success: true, user });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ success: false, message: 'Error fetching user' });
    }
});

// UPDATE USER BALANCE
router.put('/users/:id/balance', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const userId = req.params.id;
        const { amount, operation } = req.body;

        if (!amount || operation !== 'add' && operation !== 'remove') {
            return res.status(400).json({ success: false, message: 'Invalid operation' });
        }

        const connection = getConnection();
        const user = connection.get('SELECT id, balance FROM users WHERE id = ?', [userId]);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const newBalance = operation === 'add' ? user.balance + amount : user.balance - amount;

        if (operation === 'remove' && newBalance < 0) {
            return res.status(400).json({ success: false, message: 'Insufficient balance' });
        }

        connection.run('UPDATE users SET balance = ? WHERE id = ?', [newBalance, userId]);

        res.json({ success: true, message: 'Balance updated', balance: newBalance });
    } catch (error) {
        console.error('Update balance error:', error);
        res.status(500).json({ success: false, message: 'Error updating balance' });
    }
});

// UPDATE USER PASSWORD
router.put('/users/:id/password', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const userId = req.params.id;
        const { password } = req.body;

        if (!password || password.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
        }

        const connection = getConnection();
        const hashedPassword = await bcrypt.hash(password, 10);

        connection.run('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);

        res.json({ success: true, message: 'Password updated' });
    } catch (error) {
        console.error('Update password error:', error);
        res.status(500).json({ success: false, message: 'Error updating password' });
    }
});

// SUSPEND USER
router.put('/users/:id/suspend', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const userId = req.params.id;
        const connection = getConnection();

        connection.run('UPDATE users SET status = ? WHERE id = ?', ['suspended', userId]);

        res.json({ success: true, message: 'User suspended' });
    } catch (error) {
        console.error('Suspend user error:', error);
        res.status(500).json({ success: false, message: 'Error suspending user' });
    }
});

// BLOCK USER
router.put('/users/:id/block', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const userId = req.params.id;
        const connection = getConnection();

        connection.run('UPDATE users SET status = ? WHERE id = ?', ['blocked', userId]);

        res.json({ success: true, message: 'User blocked' });
    } catch (error) {
        console.error('Block user error:', error);
        res.status(500).json({ success: false, message: 'Error blocking user' });
    }
});

// UNBLOCK USER
router.put('/users/:id/unblock', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const userId = req.params.id;
        const connection = getConnection();

        connection.run('UPDATE users SET status = ? WHERE id = ?', ['active', userId]);

        res.json({ success: true, message: 'User unblocked' });
    } catch (error) {
        console.error('Unblock user error:', error);
        res.status(500).json({ success: false, message: 'Error unblocking user' });
    }
});

// RESET USER
router.put('/users/:id/reset', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const userId = req.params.id;
        const connection = getConnection();
        const defaultPassword = await bcrypt.hash('user123', 10);

        connection.run('UPDATE users SET balance = 0, password = ?, status = ? WHERE id = ?', [defaultPassword, 'active', userId]);

        res.json({ success: true, message: 'User account reset (password: user123)' });
    } catch (error) {
        console.error('Reset user error:', error);
        res.status(500).json({ success: false, message: 'Error resetting user' });
    }
});

// GET HISTORY
router.get('/history', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const connection = getConnection();

        const depositHistory = connection.all(`
            SELECT d.*, u.name as userName 
            FROM deposits d 
            JOIN users u ON d.user_id = u.id 
            ORDER BY d.created_at DESC LIMIT 100
        `);

        const withdrawalHistory = connection.all(`
            SELECT w.*, u.name as userName 
            FROM withdrawals w 
            JOIN users u ON w.user_id = u.id 
            ORDER BY w.created_at DESC LIMIT 100
        `);

        res.json({
            success: true,
            depositHistory,
            withdrawalHistory
        });
    } catch (error) {
        console.error('History error:', error);
        res.status(500).json({ success: false, message: 'Error fetching history' });
    }
});

// APPROVE DEPOSIT
router.put('/deposits/:id/approve', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const depositId = req.params.id;
        const connection = getConnection();

        const deposit = connection.get('SELECT id, user_id, amount FROM deposits WHERE id = ?', [depositId]);

        if (!deposit) {
            return res.status(404).json({ success: false, message: 'Deposit not found' });
        }

        connection.beginTransaction();
        try {
            connection.run('UPDATE deposits SET status = ? WHERE id = ?', ['approved', depositId]);
            connection.run('UPDATE users SET balance = balance + ? WHERE id = ?', [deposit.amount, deposit.user_id]);
            connection.commit();

            res.json({ success: true, message: 'Deposit approved' });
        } catch (error) {
            try {
                connection.rollback();
            } catch (e) {}
            throw error;
        }
    } catch (error) {
        console.error('Approve deposit error:', error);
        res.status(500).json({ success: false, message: 'Error approving deposit' });
    }
});

// REJECT DEPOSIT
router.put('/deposits/:id/reject', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const depositId = req.params.id;
        const connection = getConnection();

        connection.run('UPDATE deposits SET status = ? WHERE id = ?', ['rejected', depositId]);

        res.json({ success: true, message: 'Deposit rejected' });
    } catch (error) {
        console.error('Reject deposit error:', error);
        res.status(500).json({ success: false, message: 'Error rejecting deposit' });
    }
});

// APPROVE WITHDRAWAL
router.put('/withdrawals/:id/approve', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const withdrawalId = req.params.id;
        const connection = getConnection();

        const withdrawal = connection.get('SELECT id, user_id, amount FROM withdrawals WHERE id = ?', [withdrawalId]);

        if (!withdrawal) {
            return res.status(404).json({ success: false, message: 'Withdrawal not found' });
        }

        connection.run('UPDATE withdrawals SET status = ? WHERE id = ?', ['approved', withdrawalId]);

        res.json({ success: true, message: 'Withdrawal approved' });
    } catch (error) {
        console.error('Approve withdrawal error:', error);
        res.status(500).json({ success: false, message: 'Error approving withdrawal' });
    }
});

// REJECT WITHDRAWAL
router.put('/withdrawals/:id/reject', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const withdrawalId = req.params.id;
        const connection = getConnection();

        const withdrawal = connection.get('SELECT id, user_id, amount FROM withdrawals WHERE id = ?', [withdrawalId]);

        if (!withdrawal) {
            return res.status(404).json({ success: false, message: 'Withdrawal not found' });
        }

        connection.beginTransaction();
        try {
            connection.run('UPDATE withdrawals SET status = ? WHERE id = ?', ['rejected', withdrawalId]);
            connection.run('UPDATE users SET balance = balance + ? WHERE id = ?', [withdrawal.amount, withdrawal.user_id]);
            connection.commit();

            res.json({ success: true, message: 'Withdrawal rejected' });
        } catch (error) {
            try {
                connection.rollback();
            } catch (e) {}
            throw error;
        }
    } catch (error) {
        console.error('Reject withdrawal error:', error);
        res.status(500).json({ success: false, message: 'Error rejecting withdrawal' });
    }
});

// GET ANNOUNCEMENTS
router.get('/announcements', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const connection = getConnection();
        const announcements = connection.all('SELECT * FROM announcements ORDER BY created_at DESC');

        res.json({ success: true, announcements });
    } catch (error) {
        console.error('Get announcements error:', error);
        res.status(500).json({ success: false, message: 'Error fetching announcements' });
    }
});

// POST ANNOUNCEMENT
router.post('/announcements', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { title, content } = req.body;

        if (!title || !content) {
            return res.status(400).json({ success: false, message: 'Title and content are required' });
        }

        const connection = getConnection();
        connection.run('INSERT INTO announcements (title, content, created_at) VALUES (?, ?, datetime(\'now\'))', [title, content]);

        res.json({ success: true, message: 'Announcement published' });
    } catch (error) {
        console.error('Post announcement error:', error);
        res.status(500).json({ success: false, message: 'Error publishing announcement' });
    }
});

// DELETE ANNOUNCEMENT
router.delete('/announcements/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const announcementId = req.params.id;
        const connection = getConnection();

        connection.run('DELETE FROM announcements WHERE id = ?', [announcementId]);

        res.json({ success: true, message: 'Announcement deleted' });
    } catch (error) {
        console.error('Delete announcement error:', error);
        res.status(500).json({ success: false, message: 'Error deleting announcement' });
    }
});

// CREATE PROJECT
router.post('/projects', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { name, investment, dailyGain, duration } = req.body;

        if (!name || !investment || !dailyGain || !duration) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        const connection = getConnection();
        connection.run('INSERT INTO projects (name, investment, daily_gain, duration, active) VALUES (?, ?, ?, ?, 1)', 
            [name, investment, dailyGain, duration]);

        res.json({ success: true, message: 'Project created' });
    } catch (error) {
        console.error('Create project error:', error);
        res.status(500).json({ success: false, message: 'Error creating project' });
    }
});

// UPDATE PROJECT
router.put('/projects/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const projectId = req.params.id;
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, message: 'Name is required' });
        }

        const connection = getConnection();
        connection.run('UPDATE projects SET name = ? WHERE id = ?', [name, projectId]);

        res.json({ success: true, message: 'Project updated' });
    } catch (error) {
        console.error('Update project error:', error);
        res.status(500).json({ success: false, message: 'Error updating project' });
    }
});

// UPDATE PROJECT DAILY GAIN
router.put('/projects/:id/daily-gain', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const projectId = req.params.id;
        const { amount, operation } = req.body;

        if (!amount || !['add', 'remove'].includes(operation)) {
            return res.status(400).json({ success: false, message: 'Invalid request' });
        }

        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            return res.status(400).json({ success: false, message: 'Montant invalide' });
        }

        const connection = getConnection();
        const project = connection.get('SELECT id, daily_gain FROM projects WHERE id = ?', [projectId]);
        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        const updatedGain = operation === 'add'
            ? project.daily_gain + parsedAmount
            : project.daily_gain - parsedAmount;

        if (updatedGain < 0) {
            return res.status(400).json({ success: false, message: 'Le gain quotidien ne peut pas être négatif' });
        }

        connection.run('UPDATE projects SET daily_gain = ? WHERE id = ?', [updatedGain, projectId]);

        res.json({ success: true, message: 'Gain quotidien mis à jour', dailyGain: updatedGain });
    } catch (error) {
        console.error('Update project daily gain error:', error);
        res.status(500).json({ success: false, message: 'Error updating daily gain' });
    }
});

// TOGGLE PROJECT
router.put('/projects/:id/toggle', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const projectId = req.params.id;
        const connection = getConnection();

        const project = connection.get('SELECT id, active FROM projects WHERE id = ?', [projectId]);

        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        const newActive = project.active ? 0 : 1;
        connection.run('UPDATE projects SET active = ? WHERE id = ?', [newActive, projectId]);

        res.json({ success: true, message: 'Project status updated' });
    } catch (error) {
        console.error('Toggle project error:', error);
        res.status(500).json({ success: false, message: 'Error toggling project' });
    }
});

// EXPORT
module.exports = router;