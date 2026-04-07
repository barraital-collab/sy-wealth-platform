/**
 * Create Test Deposit and Approve It
 */

const http = require('http');
const { getConnection } = require('./config/database');

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

async function testFullDepositFlow() {
    console.log('🏦 Testing Full Deposit Flow...\n');

    try {
        // First, create a test user and manually insert a deposit
        console.log('1️⃣ Creating test deposit in database...');
        const db = getConnection();
        
        // Get an existing user or create one
        const user = db.prepare('SELECT id FROM users WHERE role = ? LIMIT 1').get('user');
        
        if (!user) {
            console.log('   ❌ No regular users found');
            process.exit(0);
        }

        const userId = user.id;
        console.log(`   ✅ Found user: ${userId}\n`);

        // Insert a test deposit
        console.log('2️⃣ Inserting test deposit...');
        const result = db.prepare(`
            INSERT INTO deposits (user_id, amount, method, status, created_at)
            VALUES (?, ?, ?, ?, datetime('now'))
        `).run(userId, 10000, 'wave', 'pending');

        const depositId = result.lastInsertRowid;
        console.log(`   ✅ Deposit created with ID: ${depositId}\n`);

        // Now test approval
        console.log('3️⃣ Testing admin login...');
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
                
                if (loginData.success) {
                    const token = loginData.token;
                    console.log(`   ✅ Admin logged in\n`);

                    // Get Dashboard
                    console.log('4️⃣ Checking dashboard...');
                    const dashRes = await makeRequest('GET', '/api/admin/dashboard', null, token);
                    console.log(`   Deposits count: ${dashRes.data?.deposits?.length || 0}\n`);

                    // Approve the deposit
                    console.log(`5️⃣ Attempting to approve deposit ${depositId}...\n`);
                    const approveRes = await makeRequest('PUT', `/api/admin/deposits/${depositId}/approve`, null, token);
                    
                    console.log(`   Status: ${approveRes.status}`);
                    console.log(`   Response:`, JSON.stringify(approveRes.data, null, 2));
                    
                    if (approveRes.status === 200 && approveRes.data?.success) {
                        console.log('\n✅ Deposit approved successfully!');
                        
                        // Check user balance
                        const userAfter = db.prepare('SELECT balance FROM users WHERE id = ?').get(userId);
                        console.log(`   User balance after approval: ${userAfter.balance}`);
                    } else {
                        console.log(`\n❌ Error approving deposit`);
                    }
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

testFullDepositFlow();
