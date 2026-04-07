/**
 * Test Project Data Structure
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

async function testProjectStructure() {
    console.log('🎯 Testing Project Data Structure...\n');

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

                    // Get Dashboard
                    const dashRes = await makeRequest('GET', '/api/admin/dashboard', token);
                    
                    if (dashRes.data?.projects && dashRes.data.projects.length > 0) {
                        console.log('📋 Project Structure:');
                        console.log(JSON.stringify(dashRes.data.projects[0], null, 2));
                        
                        const proj = dashRes.data.projects[0];
                        console.log('\n✅ Field Mapping Check:');
                        console.log(`   investment: ${proj.investment ? '✓' : '✗'}`);
                        console.log(`   daily_gain: ${proj.daily_gain ? '✓' : '✗'}`);
                        console.log(`   dailyGain: ${proj.dailyGain ? '✓' : '✗'}`);
                        console.log(`   duration: ${proj.duration ? '✓' : '✗'}`);
                        console.log(`   active: ${proj.active ? '✓' : '✗'}`);
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

testProjectStructure();
