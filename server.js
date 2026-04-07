/**
 * SY Wealth - Backend Server
 * Express.js API Server
 */

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const cron = require('node-cron');
const bcrypt = require('bcryptjs');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.options('*', cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static('public'));

// Import Database
const { getConnection } = require('./config/database');

// ============================================
// DATABASE INITIALIZATION
// ============================================

async function initializeDatabase() {
    try {
        const connection = getConnection();

        console.log('Initializing database...');

        // Check and create admin user if doesn't exist
        const adminUser = connection.get(
            'SELECT id FROM users WHERE phone = ?',
            ['0707070707']
        );

        if (!adminUser) {
            console.log('Creating admin user...');
            const hashedPassword = await bcrypt.hash('admin123', 10);
            connection.run(
                'INSERT INTO users (name, phone, password, role, balance, status) VALUES (?, ?, ?, ?, ?, ?)',
                ['Admin SY Wealth', '0707070707', hashedPassword, 'admin', 0, 'active']
            );
            console.log('✓ Admin user created: 0707070707 / admin123');
        }

        // Check and create test projects if don't exist
        const projectCount = connection.get('SELECT COUNT(*) as count FROM projects');

        if (projectCount.count === 0) {
            console.log('Creating test projects...');
            const testProjects = [
                { name: 'Desktop PC', investment: 150000, daily_gain: 25000, duration: 30 },
                { name: 'Gaming PC', investment: 300000, daily_gain: 55000, duration: 30 },
                { name: 'Server System', investment: 500000, daily_gain: 100000, duration: 30 },
                { name: 'Laptop Pro', investment: 200000, daily_gain: 35000, duration: 30 },
                { name: 'Workstation', investment: 400000, daily_gain: 80000, duration: 30 }
            ];

            for (const project of testProjects) {
                connection.run(
                    'INSERT INTO projects (name, investment, daily_gain, duration, active) VALUES (?, ?, ?, ?, 1)',
                    [project.name, project.investment, project.daily_gain, project.duration]
                );
            }
            console.log('✓ Test projects created');
        }

        console.log('✓ Database initialization complete\n');
    } catch (error) {
        console.error('Database initialization error:', error);
    }
}

// Import Routes
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const investmentRoutes = require('./routes/investments');
const depositRoutes = require('./routes/deposits');
const withdrawalRoutes = require('./routes/withdrawals');
const adminRoutes = require('./routes/admin');
const statisticsRoutes = require('./routes/statistics');
const taskRoutes = require('./routes/tasks');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/investments', investmentRoutes);
app.use('/api/deposits', depositRoutes);
app.use('/api/withdrawals', withdrawalRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/statistics', statisticsRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// 404 Handler - Catch all unmatched routes
app.use('*', (req, res) => {
    console.warn(`404: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ 
        success: false, 
        error: '404',
        path: req.originalUrl,
        message: `Route non trouvée. Endpoints disponibles: /api/health, /api/auth/login, /api/dashboard, /api/investments/products, etc. Vérifiez la console serveur.`
    });
});


// CRON JOB - Process daily earnings
// Runs every day at 00:00
cron.schedule('0 0 * * *', async () => {
    console.log('Running daily earnings job...');
    try {
        const connection = getConnection();

        // Get all active investments
        const investments = connection.all(`
            SELECT i.*,
                   p.daily_gain,
                   u.id as user_id,
                   u.balance,
                   u.referred_by
            FROM investments i
            JOIN projects p ON i.project_id = p.id
            JOIN users u ON i.user_id = u.id
            WHERE i.status = 'active' AND i.days_remaining > 0
        `);

        for (const investment of investments) {
            const taskCompleted = connection.get(
                `SELECT COUNT(*) as count FROM user_tasks
                 WHERE user_id = ?
                   AND completed_at >= datetime('now', '-1 day')`,
                [investment.user_id]
            );

            const shouldPayEarnings = taskCompleted.count > 0;

            // Reduce days remaining even if user misses the task.
            connection.run(
                'UPDATE investments SET days_remaining = days_remaining - 1 WHERE id = ?',
                [investment.id]
            );

            // If days remaining is 0, mark as completed
            if (investment.days_remaining <= 1) {
                connection.run(
                    'UPDATE investments SET status = ?, completed_at = datetime(\'now\') WHERE id = ?',
                    ['completed', investment.id]
                );
            }

            if (shouldPayEarnings) {
                const alreadyPaid = connection.get(
                    `SELECT COUNT(*) as count FROM transactions
                     WHERE user_id = ?
                       AND investment_id = ?
                       AND type = 'earnings'
                       AND created_at >= datetime('now', '-1 day')`,
                    [investment.user_id, investment.id]
                );

                if (alreadyPaid.count === 0) {
                    connection.run(
                        'UPDATE users SET balance = balance + ? WHERE id = ?',
                        [investment.daily_gain, investment.user_id]
                    );

                    connection.run(
                        'INSERT INTO transactions (user_id, investment_id, type, amount, status, created_at) VALUES (?, ?, ?, ?, ?, datetime(\'now\'))',
                        [investment.user_id, investment.id, 'earnings', investment.daily_gain, 'completed']
                    );

                    if (investment.referred_by) {
                        const referralCommission = parseFloat((investment.daily_gain * 0.02).toFixed(2));
                        if (referralCommission > 0) {
                            connection.run(
                                'UPDATE users SET balance = balance + ? WHERE id = ?',
                                [referralCommission, investment.referred_by]
                            );
                            connection.run(
                                'INSERT INTO transactions (user_id, investment_id, type, amount, status, created_at) VALUES (?, ?, ?, ?, ?, datetime(\'now\'))',
                                [investment.referred_by, investment.id, 'referral_commission', referralCommission, 'completed']
                            );
                        }
                    }
                } else {
                    console.log(`Skipping duplicate earnings payment for investment ${investment.id} and user ${investment.user_id}`);
                }
            } else {
                connection.run(
                    'INSERT INTO transactions (user_id, type, amount, status, created_at) VALUES (?, ?, ?, ?, datetime(\'now\'))',
                    [investment.user_id, 'earnings_missed', 0, 'failed']
                );
            }
        }

        console.log(`Processed earnings for ${investments.length} investments`);
    } catch (error) {
        console.error('Error in daily earnings job:', error);
    }
});

// CRON JOB - Reset daily tasks at 00:00
cron.schedule('0 0 * * *', async () => {
    console.log('Running daily task reset job...');
    try {
        const connection = getConnection();

        // Reset all user task completions (mark as not completed for today)
        // This allows users to complete tasks again for the new day
        const resetResult = connection.run(
            `DELETE FROM user_tasks
             WHERE completed_at < datetime('now', 'start of day')`
        );

        console.log(`Reset ${resetResult.changes} completed tasks for daily renewal`);
    } catch (error) {
        console.error('Error in daily task reset job:', error);
    }
});

// Start server with port fallback
const BASE_PORT = process.env.PORT || 3000;

// Initialize database and start server
initializeDatabase().then(() => {
    const server = app.listen(BASE_PORT);
    
    server.on('listening', () => {
        console.log(`✓ SY Wealth API Server running on http://localhost:${server.address().port}`);
        console.log(`\n📱 Access the app at http://localhost:${server.address().port}`);
        console.log(`📝 Admin panel at http://localhost:${server.address().port}/admin-login.html`);
    });
    
    server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
            console.log(`Port ${BASE_PORT} is in use, trying port ${BASE_PORT + 1}...`);
            const nextServer = app.listen(BASE_PORT + 1);
            nextServer.on('listening', () => {
                console.log(`✓ SY Wealth API Server running on http://localhost:${nextServer.address().port}`);
                console.log(`\n📱 Access the app at http://localhost:${nextServer.address().port}`);
                console.log(`📝 Admin panel at http://localhost:${nextServer.address().port}/admin-login.html`);
            });
            nextServer.on('error', (err) => {
                console.error('Failed to start server:', err);
                process.exit(1);
            });
        } else {
            console.error('Server error:', error);
            process.exit(1);
        }
    });
}).catch(error => {
    console.error('Failed to initialize database:', error);
    process.exit(1);
});

module.exports = app;
