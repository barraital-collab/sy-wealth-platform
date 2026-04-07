/**
 * Test Deposit Approval
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
    console.log('💳 Testing Deposit Approval...\n');

    try {
        // Login
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
                    console.log('✅ Admin logged in\n');

                    // Get Dashboard to find pending deposits
                    const dashRes = await makeRequest('GET', '/api/admin/dashboard', null, token);
                    
                    console.log('📋 Pending Deposits:');
                    if (dashRes.data?.deposits && dashRes.data.deposits.length > 0) {
                        console.log(`   Found ${dashRes.data.deposits.length} deposit(s)\n`);
                        
                        const deposit = dashRes.data.deposits[0];
                        console.log('   Deposit Details:');
                        console.log(JSON.stringify(deposit, null, 2));
                        
                        if (deposit.id) {
                            console.log(`\n⏳ Attempting to approve deposit ${deposit.id}...\n`);
                            
                            const approveRes = await makeRequest('PUT', `/api/admin/deposits/${deposit.id}/approve`, null, token);
                            
                            console.log(`   Status: ${approveRes.status}`);
                            console.log(`   Response:`, approveRes.data);
                            
                            if (approveRes.status === 200) {
                                console.log('\n✅ Deposit approved successfully!');
                            } else {
                                console.log(`\n❌ Error approving deposit: ${approveRes.data?.message}`);
                            }
                        }
                    } else {
                        console.log('   ⚠️  No pending deposits found');
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

testDepositApproval();
