# SY Wealth - Quick Start Guide

Get SY Wealth running in minutes!

## 5-Minute Quick Start (Local Development)

### 1. Prerequisites Check ✓
```bash
node --version  # Should be v14+
npm --version
mysql --version
```

### 2. Setup Database (2 minutes)

```bash
# Login to MySQL
mysql -u root -p

# Run this command:
SOURCE C:/Users/JEPORA/Desktop/SY/database-schema.sql;

# Exit MySQL
EXIT;
```

### 3. Install Dependencies (2 minutes)

```bash
cd C:\Users\JEPORA\Desktop\SY
npm install
```

### 4. Start Server (1 minute)

```bash
npm run dev
```

Server starts on http://localhost:3000

### 5. Open in Browser

🌐 **Homepage:** http://localhost:3000/public/index.html

## Test the Platform

### Sign Up as User
1. Click "S'inscrire" (top right)
2. Fill form with:
   - Name: Test User
   - Phone: 0600000001
   - Password: testpass123
3. Click "Créer mon compte"

### Make a Deposit
1. Go to Dashboard → Dépôt
2. Amount: 5000
3. Method: Wave
4. Do NOT actually send payment (just for testing)
5. Click "Soumettre dépôt"

### Make an Investment
1. Go to Dashboard → Investir
2. Click "Investir" on any product
3. Confirms investment created

### Login as Admin
1. Go to http://localhost:3000/public/admin.html
2. Phone: 0707070707
3. Password: admin123

### Approve Deposit
1. In Admin → Dépôts
2. Click "Valider" on test deposit
3. User balance increases

## File Locations

| Item | Path |
|------|------|
| Frontend Files | `public/` |
| Backend Server | `server.js` |
| Database Setup | `database-schema.sql` |
| Config | `.env` |
| Routes | `routes/` |

## Important Files to Know

```
📁 SY Wealth/
├── 📄 server.js ..................... Main API server
├── 📄 package.json .................. Dependencies
├── 📄 .env .......................... Configuration
├── 📄 database-schema.sql ........... Database setup
├── 📁 public/
│   ├── 📄 index.html ............... Homepage
│   ├── 📄 login.html ............... Login page
│   ├── 📄 signup.html .............. Registration
│   ├── 📄 dashboard.html ........... User dashboard
│   ├── 📄 admin.html ............... Admin panel
│   ├── 📁 css/
│   │   └── 📄 style.css ........... Styling
│   └── 📁 js/
│       ├── 📄 main.js ............ Core functions
│       ├── 📄 dashboard.js ....... Dashboard logic
│       └── 📄 admin.js ........... Admin logic
└── 📁 routes/
    ├── 📄 auth.js ................. Login/Signup
    ├── 📄 admin.js ............... Admin actions
    └── ... (other routes)
```

## Common Commands

```bash
# Start development server (with auto-reload)
npm run dev

# Start production server
npm start

# Install dependencies
npm install

# View npm packages
npm list
```

## How to Test Features

### Test User Registration
```
Phone: 0601234567
Name: Test User
Password: test1234
```

### Test Investment
Make a deposit first (with fake receipt), then invest in any product

### Test Daily Earnings
Tomorrow at midnight, earnings will be added automatically
(Or modify CRON schedule in server.js to test)

### Test Admin Actions
Use admin credentials to:
- Approve deposit → User balance increases
- Reject withdrawal → Amount stays in account
- Create product → New investment option appears

## Troubleshooting

### Can't connect to database?
```bash
# Check MySQL is running
mysql --version

# Check database exists
mysql -u root -p
SHOW DATABASES;
USE sy_wealth;
SHOW TABLES;
```

### Port 3000 already in use?
```bash
# Windows: Kill process on port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac:
lsof -i :3000
kill -9 <PID>
```

### Module not found error?
```bash
cd C:\Users\JEPORA\Desktop\SY
npm install
```

### Still having issues?
See full documentation in README.md

## Next Steps

Once running locally:

1. **Explore Code** - See how it all works
2. **Customize** - Change colors, products, earnings
3. **Deploy** - Follow DEPLOYMENT.md to go live
4. **Manage** - Use ADMIN_GUIDE.md for operations
5. **Scale** - Add more features:
   - Email notifications
   - SMS alerts
   - Multi-language support
   - Mobile app

## Features You Can Try Now

✅ User Registration  
✅ Login/Logout  
✅ Dashboard View  
✅ Investments  
✅ Deposits (fake payment)  
✅ Withdrawals  
✅ Admin Approval  
✅ Statistics  
✅ Profile Management  

## Production Checklist

Before going live:

- [ ] Change .env values for production
- [ ] Update JWT_SECRET
- [ ] Enable HTTPS
- [ ] Setup database backups
- [ ] Configure payment methods (Wave/Orange)
- [ ] Test all features thoroughly
- [ ] Setup monitoring
- [ ] Create admin user

## Need Help?

- 📖 See README.md for full documentation
- 👨‍💼 See ADMIN_GUIDE.md for admin operations
- 🚀 See DEPLOYMENT.md for production setup
- 💾 Database schema in database-schema.sql

---

## Your Platform is Ready! 🎉

Visit http://localhost:3000 and explore!

Questions? Check the documentation files or the code comments.

---

**Quick Start Version:** 1.0  
**Last Updated:** April 2026
