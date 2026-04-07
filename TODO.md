# Admin Features Fix - TODO

## Steps to Complete:

- [ ] **Step 1: Backup database**  
  Execute: `copy sy_wealth.db sy_wealth_adminfix_backup_$(date /t).db`

- [x] **Step 2: Implement complete routes/admin.js**  
  Added /dashboard endpoint
  Add missing endpoints: /dashboard, /users (GET), users/:id (GET/PUT), projects CRUD, deposits/withdrawals approve/reject

- [ ] **Step 3: Fix delete user endpoint**  
  Add child record cleanup + DB transaction

- [ ] **Step 4: Restart server**  
  `node server.js` (kill existing if needed)

- [ ] **Step 5: Test Admin Flow**  
  1. Login: http://localhost:3000/admin-login.html (0707070707/admin123)  
  2. Verify dashboard loads (users, products, deposits)  
  3. Test delete user (create test user if needed)  
  4. Test approve deposit/withdrawal

- [ ] **Step 6: Verify registration notifications**  
  Signup new user → check console/email

- [ ] **Step 7: Frontend verification**  
  Tables populate, actions work

## Current Progress: Starting implementation...

**Next Action:** Edit routes/admin.js
