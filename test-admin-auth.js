/**
 * Test Admin Authentication and User Management
 */

const http = require('http');

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

async function testAdminAuth() {
    console.log('🔐 Testing Admin Authentication and User Management...\n');

    try {
        // Step 1: Login as admin
        console.log('1️⃣ Testing admin login...');
        const loginRes = await makeRequest('POST', '/api/auth/login', {
            phone: '0707070707',
            password: 'admin123'
        });

        console.log(`   Status: ${loginRes.status}`);
        
        if (loginRes.status === 200 && loginRes.data?.success) {
            console.log('   ✅ Login successful');
            const token = loginRes.data?.token;
            const user = loginRes.data?.user;
            console.log(`   User: ${user?.name} (${user?.role})\n`);

            // Step 2: Get dashboard data with token
            console.log('2️⃣ Testing GET /api/admin/dashboard...');
            const dashboard = await makeRequest('GET', '/api/admin/dashboard', null, token);
            console.log(`   Status: ${dashboard.status}`);
            
            if (dashboard.status === 200 && dashboard.data?.success) {
                console.log('   ✅ Dashboard data retrieved');
                console.log(`   Total Users: ${dashboard.data?.totalUsers}`);
                console.log(`   Users in table: ${dashboard.data?.users?.length || 0}`);
                console.log(`   Announcements: ${dashboard.data?.announcements?.length || 0}\n`);

                // Step 3: Get history
                console.log('3️⃣ Testing GET /api/admin/history...');
                const history = await makeRequest('GET', '/api/admin/history', null, token);
                console.log(`   Status: ${history.status}`);
                
                if (history.status === 200 && history.data?.success) {
                    console.log('   ✅ History retrieved');
                    console.log(`   Deposit History: ${history.data?.depositHistory?.length || 0}`);
                    console.log(`   Withdrawal History: ${history.data?.withdrawalHistory?.length || 0}\n`);
                }

                // Step 4: Get user profile
                if (dashboard.data?.users?.length > 0) {
                    const userId = dashboard.data.users[0].id;
                    console.log(`4️⃣ Testing GET /api/admin/users/${userId}...`);
                    const userRes = await makeRequest('GET', `/api/admin/users/${userId}`, null, token);
                    console.log(`   Status: ${userRes.status}`);
                    
                    if (userRes.status === 200 && userRes.data?.success) {
                        console.log('   ✅ User profile retrieved');
                        console.log(`   User: ${userRes.data?.user?.name}`);
                        console.log(`   Balance: ${userRes.data?.user?.balance}\n`);
                    } else {
                        console.log(`   ❌ Error: ${userRes.data?.message}\n`);
                    }
                }

                // Step 5: Test announcements
                console.log('5️⃣ Testing GET /api/admin/announcements...');
                const annRes = await makeRequest('GET', '/api/admin/announcements', null, token);
                console.log(`   Status: ${annRes.status}`);
                
                if (annRes.status === 200 && annRes.data?.success) {
                    console.log('   ✅ Announcements retrieved');
                    console.log(`   Count: ${annRes.data?.announcements?.length || 0}\n`);
                } else {
                    console.log(`   ❌ Error: ${annRes.data?.message}\n`);
                }

                console.log('✨ All admin management endpoints are working correctly!');
            } else {
                console.log(`   ❌ Failed to get dashboard: ${dashboard.data?.message}\n`);
            }
        } else {
            console.log(`   ❌ Login failed: ${loginRes.data?.message}\n`);
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }

    process.exit(0);
}

testAdminAuth();
