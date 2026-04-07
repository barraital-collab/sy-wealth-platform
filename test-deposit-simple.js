/**
 * Test Deposit Approval via API
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

async function testDepositApproval() {
    console.log('💳 Testing Deposit Approval via API...\n');

    try {
        // Login as admin
        console.log('1️⃣ Admin login...');
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
                console.log('   ✅ Admin logged in\n');

                // Get dashboard to see if there are pending deposits
                console.log('2️⃣ Getting dashboard...');
                const dashRes = await makeRequest('GET', '/api/admin/dashboard', null, token);
                console.log(`   Pending deposits: ${dashRes.data?.deposits?.length || 0}\n`);

                if (dashRes.data?.deposits && dashRes.data.deposits.length > 0) {
                    const depositId = dashRes.data.deposits[0].id;
                    console.log(`3️⃣ Attempting to approve deposit ${depositId}...\n`);
                    
                    const approveRes = await makeRequest('PUT', `/api/admin/deposits/${depositId}/approve`, null, token);
                    
                    console.log(`   Status: ${approveRes.status}`);
                    console.log(`   Response: ${JSON.stringify(approveRes.data)}`);
                    
                    if (approveRes.status === 200 && approveRes.data?.success) {
                        console.log('\n✅ Deposit approved successfully!');
                    } else {
                        console.log(`\n❌ Error: ${approveRes.data?.message}`);
                    }
                } else {
                    console.log('   ℹ️  No pending deposits to test');
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

testDepositApproval();
