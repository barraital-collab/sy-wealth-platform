/**
 * Setup Test Investment for Claim Salary Testing
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'sy_wealth.db');
const db = new sqlite3.Database(dbPath);

function setupTestInvestment() {
    console.log('🔧 Setting up test investment for claim salary testing...\n');

    // First, get the test user ID
    db.get("SELECT id FROM users WHERE phone = '0555555555'", (err, user) => {
        if (err) {
            console.error('❌ Error getting user:', err);
            return;
        }

        if (!user) {
            console.log('❌ Test user not found');
            return;
        }

        console.log(`✅ Found test user ID: ${user.id}`);

        // Get a project to invest in
        db.get("SELECT id, name, daily_gain FROM projects WHERE active = 1 LIMIT 1", (err, project) => {
            if (err) {
                console.error('❌ Error getting project:', err);
                return;
            }

            if (!project) {
                console.log('❌ No active projects found');
                return;
            }

            console.log(`✅ Found project: ${project.name} (Daily gain: ${project.daily_gain})`);

            // Create an active investment
            const investmentAmount = 10000;
            const daysRemaining = 30;

            db.run(`
                INSERT INTO investments (user_id, project_id, amount, daily_gain, days_remaining, status)
                VALUES (?, ?, ?, ?, ?, 'active')
            `, [user.id, project.id, investmentAmount, project.daily_gain, daysRemaining], function(err) {
                if (err) {
                    console.error('❌ Error creating investment:', err);
                    return;
                }

                console.log(`✅ Created test investment ID: ${this.lastID}`);
                console.log(`   Amount: ${investmentAmount} FCFA`);
                console.log(`   Days remaining: ${daysRemaining}`);
                console.log(`   Expected daily gain: ${project.daily_gain} FCFA\n`);

                console.log('🎯 Test investment setup complete!');
                console.log('   You can now run test-claim-salary.js to test the claim functionality.\n');

                db.close();
            });
        });
    });
}

setupTestInvestment();