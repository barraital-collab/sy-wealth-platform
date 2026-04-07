/**
 * Create and Approve Test Deposit
 */

const Database = require('better-sqlite3');
const path = require('path');
const http = require('http');

const dbPath = path.join(__dirname, 'sy_wealth.db');
const db = new Database(dbPath);

function makeRequest(method, path, body = null, token = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 30001,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({
                        status: res.statusCode,
                        data: JSON.parse(data)
                    });
                } catch (e) {
                    resolve({
                        status: res.statusCode,
                        data: data
                    });
                }
            });
        });

        req.on('error', reject);
        
        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

async function testWithDatabaseInsert() {
    console.log('💳 Create and Approve Test Deposit...\n');

    try {
        // Get a user
        console.log('1️⃣ Getting a test user...');
        const user = db.prepare('SELECT id FROM users WHERE role = ? LIMIT 1').get('user');
        
        if (!user) {
            console.log('   ❌ No users found');
            process.exit(0);
        }
        
        const userId = user.id;
        console.log(`   ✅ Found user ID: ${userId}\n`);

        // Insert test deposit
        console.log('2️⃣ Inserting test deposit...');
        const result = db.prepare(`
            INSERT INTO deposits (user_id, amount, method, status, created_at)
            VALUES (?, ?, ?, ?, datetime('now'))
        `).run(userId, 25000, 'wave', 'pending');

        const depositId = result.lastInsertRowid;
        console.log(`   ✅ Deposit created ID: ${depositId}\n`);

        // Verify it exists
        const deposit = db.prepare('SELECT * FROM deposits WHERE id = ?').get(depositId);
        console.log('   Deposit details:');
        console.log(`     - ID: ${deposit.id}`);
        console.log(`     - User: ${deposit.user_id}`);
        console.log(`     - Amount: ${deposit.amount}`);
        console.log(`     - Status: ${deposit.status}\n`);

        // Login and approve
        console.log('3️⃣ Admin login...');
        const loginReq = http.request({
            hostname: 'localhost',
            port: 30001,
            path: '/api/auth/login',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', async () => {
                const loginData = JSON.parse(data);
                
                if (!loginData.success) {
                    console.log('   ❌ Login failed');
                    process.exit(0);
                }

                const token = loginData.token;
                console.log('   ✅ Logged in\n');

                // Get dashboard to verify deposit shows
                console.log('4️⃣ Checking dashboard for pending deposits...');
                const dashRes = await makeRequest('GET', '/api/admin/dashboard', null, token);
                console.log(`   Found: ${dashRes.data?.deposits?.length || 0} deposits\n`);

                // Approve the deposit
                console.log(`5️⃣ Approving deposit ${depositId}...\n`);
                const approveRes = await makeRequest('PUT', `/api/admin/deposits/${depositId}/approve`, null, token);
                
                console.log(`   Status: ${approveRes.status}`);
                console.log(`   Response: ${JSON.stringify(approveRes.data)}`);
                
                if (approveRes.status === 200 && approveRes.data?.success) {
                    console.log('\n✅ Deposit approved successfully!');
                    
                    // Check user balance
                    const userAfter = db.prepare('SELECT balance FROM users WHERE id = ?').get(userId);
                    const depositAfter = db.prepare('SELECT status FROM deposits WHERE id = ?').get(depositId);
                    console.log(`   User balance (after): ${userAfter.balance}`);
                    console.log(`   Deposit status: ${depositAfter.status}`);
                } else {
                    console.log(`\n❌ Error: ${approveRes.data?.message}`);
                }

                process.exit(0);
            });
        });

        loginReq.write(JSON.stringify({ phone: '0707070707', password: 'admin123' }));
        loginReq.end();

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error(error);
        process.exit(1);
    }
}

testWithDatabaseInsert();
