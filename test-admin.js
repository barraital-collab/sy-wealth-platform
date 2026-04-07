const http = require('http');

// Test Admin Endpoints
async function testAdminEndpoints() {
  console.log('🧪 Testing Admin Features...');
  
  // Test 1: Health
  http.get('http://localhost:3000/api/health', (res) => {
    console.log('✅ Health:', res.statusCode);
  });
  
  // Test 2: Login (simulate - needs token)
  console.log('💡 Login first at http://localhost:3000/admin-login.html');
  console.log('Admin: 0707070707 / admin123');
  
  // Test 3: Check users count
  http.get('http://localhost:3000/api/admin/users', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        console.log('👥 Users:', json.success ? json.users?.length || 0 : 'ERROR');
      } catch(e) {
        console.log('❌ Users API Error:', data);
      }
    });
  }).on('error', e => console.log('Network error'));
  
  setTimeout(() => process.exit(0), 2000);
}

testAdminEndpoints();
