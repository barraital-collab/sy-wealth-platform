/**
 * Test Admin Dashboard Data Retrieval
 */

const http = require('http');

function makeRequest(method, path, token = null) {
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
        req.end();
    });
}

async function testDashboardData() {
    console.log('📊 Testing Dashboard Data Loading...\n');

    try {
        // Step 1: Login
        console.log('1️⃣ Testing admin login...');
        const loginRes = await makeRequest('POST', '/api/auth/login');
        
        // Manual login with body
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
                console.log(`   Status: ${loginData.success ? '✅' : '❌'}`);
                
                if (loginData.success) {
                    const token = loginData.token;
                    console.log(`   Token: ${token.substring(0, 20)}...\n`);

                    // Step 2: Get Dashboard
                    console.log('2️⃣ Testing GET /api/admin/dashboard...');
                    const dashRes = await makeRequest('GET', '/api/admin/dashboard', token);
                    console.log(`   Status: ${dashRes.status}`);
                    
                    if (dashRes.data?.success) {
                        console.log(`   ✅ Success`);
                        console.log(`   Total Users: ${dashRes.data.totalUsers}`);
                        console.log(`   Users Array: ${dashRes.data.users?.length || 0} users`);
                        console.log(`   Projects Array: ${dashRes.data.projects?.length || 0} projects`);
                        console.log(`   Deposits: ${dashRes.data.deposits?.length || 0}`);
                        console.log(`   Withdrawals: ${dashRes.data.withdrawals?.length || 0}`);
                        console.log(`   Announcements: ${dashRes.data.announcements?.length || 0}\n`);

                        if (dashRes.data.users && dashRes.data.users.length > 0) {
                            console.log('   📋 Sample User:');
                            console.log(`      ID: ${dashRes.data.users[0].id}`);
                            console.log(`      Name: ${dashRes.data.users[0].name}`);
                            console.log(`      Phone: ${dashRes.data.users[0].phone}\n`);
                        } else {
                            console.log('   ⚠️  No users returned!\n');
                        }

                        if (dashRes.data.projects && dashRes.data.projects.length > 0) {
                            console.log('   🎯 Sample Project:');
                            console.log(`      ID: ${dashRes.data.projects[0].id}`);
                            console.log(`      Name: ${dashRes.data.projects[0].name}`);
                            console.log(`      Active: ${dashRes.data.projects[0].active}\n`);
                        } else {
                            console.log('   ⚠️  No projects returned!\n');
                        }

                        console.log('✨ Data retrieval successful!');
                    } else {
                        console.log(`   ❌ Error: ${dashRes.data?.message}\n`);
                    }
                }
                process.exit(0);
            });
        });

        loginReq.write(JSON.stringify({ phone: '0707070707', password: 'admin123' }));
        loginReq.end();

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        process.exit(1);
    }
}

testDashboardData();
