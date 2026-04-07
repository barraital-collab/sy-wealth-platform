/**
 * Test Claim Salary Functionality
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

async function testClaimSalary() {
    console.log('💰 Testing Claim Salary Functionality...\n');

    try {
        // Login as test user
        console.log('1️⃣ User login...');
        const loginRes = await makeRequest('POST', '/api/auth/login', {
            phone: '0555555555',
            password: 'user123'
        });

        if (!loginRes.data.success) {
            console.log('   ❌ Login failed');
            return;
        }

        const token = loginRes.data.token;
        console.log(`   ✅ User logged in: ${loginRes.data.user.name}\n`);

        // Get dashboard data
        console.log('2️⃣ Getting dashboard data...');
        const dashboardRes = await makeRequest('GET', '/api/dashboard', null, token);
        console.log(`   Status: ${dashboardRes.status}`);
        if (dashboardRes.status === 200 && dashboardRes.data.success) {
            console.log(`   Balance: ${dashboardRes.data.balance} FCFA`);
            console.log(`   Active investments: ${dashboardRes.data.investments.length}\n`);
        }

        // Try to claim salary
        console.log('3️⃣ Claiming salary...');
        const claimRes = await makeRequest('POST', '/api/dashboard/claim-salary', null, token);
        console.log(`   Status: ${claimRes.status}`);
        console.log(`   Response: ${JSON.stringify(claimRes.data, null, 2)}\n`);

        if (claimRes.status === 200 && claimRes.data.success) {
            console.log('✅ Salary claimed successfully!');
        } else {
            console.log('❌ Failed to claim salary');
        }

        // Try to claim again (should fail)
        console.log('4️⃣ Trying to claim again (should fail)...');
        const claimAgainRes = await makeRequest('POST', '/api/dashboard/claim-salary', null, token);
        console.log(`   Status: ${claimAgainRes.status}`);
        console.log(`   Response: ${JSON.stringify(claimAgainRes.data, null, 2)}\n`);

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testClaimSalary();