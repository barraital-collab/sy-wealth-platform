/**
 * Test Task Completion
 */

const http = require('http');

function makeRequest(method, path, body = null, token = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
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

async function testTaskCompletion() {
    console.log('📋 Testing Task Completion...\n');

    try {
        // Login as a regular user
        console.log('1️⃣ User login...');
        const loginReq = http.request({
            hostname: 'localhost',
            port: 3000,
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
                console.log(`   ✅ User logged in: ${loginData.user.name}\n`);

                // Get available tasks
                console.log('2️⃣ Getting available tasks...');
                const tasksRes = await makeRequest('GET', '/api/tasks', null, token);
                console.log(`   Status: ${tasksRes.status}`);
                
                if (tasksRes.status === 200 && tasksRes.data?.tasks) {
                    console.log(`   Found: ${tasksRes.data.tasks.length} tasks\n`);
                    
                    if (tasksRes.data.tasks.length > 0) {
                        const task = tasksRes.data.tasks[0];
                        console.log(`   Sample task: "${task.title}"`);
                        console.log(`   Completed: ${task.completed ? 'Yes' : 'No'}\n`);

                        if (!task.completed) {
                            // Try to complete the task
                            console.log(`3️⃣ Completing task ${task.id}...\n`);
                            const completeRes = await makeRequest('POST', `/api/tasks/${task.id}/complete`, null, token);
                            
                            console.log(`   Status: ${completeRes.status}`);
                            console.log(`   Response: ${JSON.stringify(completeRes.data)}`);
                            
                            if (completeRes.status === 200 && completeRes.data?.success) {
                                console.log('\n✅ Task completed successfully!');
                            } else {
                                console.log(`\n❌ Error: ${completeRes.data?.message}`);
                            }
                        } else {
                            console.log('   ℹ️  Task already completed');
                        }
                    } else {
                        console.log('   ⚠️  No tasks available');
                    }
                } else {
                    console.log(`   ❌ Error: ${tasksRes.data?.message}`);
                }

                process.exit(0);
            });
        });

        // Login with a user account (create one if needed)
        loginReq.write(JSON.stringify({ phone: '0555555555', password: 'user123' }));
        loginReq.end();

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        process.exit(1);
    }
}

testTaskCompletion();
