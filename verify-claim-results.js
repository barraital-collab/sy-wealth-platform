/**
 * Verify Claim Salary Results
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

async function verifyClaimResults() {
    console.log('🔍 Verifying Claim Salary Results...\n');

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

        // Get updated dashboard data
        console.log('2️⃣ Checking updated dashboard data...');
        const dashboardRes = await makeRequest('GET', '/api/dashboard', null, token);
        console.log(`   Status: ${dashboardRes.status}`);

        if (dashboardRes.status === 200 && dashboardRes.data.success) {
            console.log(`   ✅ New balance: ${dashboardRes.data.balance} FCFA (should be 35,000)`);
            console.log(`   ✅ Today's earnings: ${dashboardRes.data.gainToday} FCFA (should be 25,000)`);

            if (dashboardRes.data.investments.length > 0) {
                const investment = dashboardRes.data.investments[0];
                console.log(`   ✅ Investment days remaining: ${investment.daysRemaining} (should be 29)`);
                console.log(`   ✅ Daily gain: ${investment.dailyGain} FCFA`);
            } else {
                console.log('   ❌ No active investments found');
            }

            // Check recent transactions
            console.log('\n3️⃣ Recent transactions:');
            dashboardRes.data.transactions.slice(0, 3).forEach((trans, index) => {
                console.log(`   ${index + 1}. ${trans.type}: ${trans.amount} FCFA (${trans.status})`);
            });

        } else {
            console.log('   ❌ Failed to get dashboard data');
        }

    } catch (error) {
        console.error('❌ Verification failed:', error.message);
    }
}

verifyClaimResults();