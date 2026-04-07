# SY Wealth - Complete Investment Platform

A full-featured investment platform built with Node.js, Express, MySQL, and vanilla JavaScript. Users can invest in hardware products, manage deposits/withdrawals, and track earnings. Admins have complete control over users, projects, deposits, and withdrawals.

## Features

### User Features
- ✅ User registration and authentication with secure JWT tokens
- ✅ Dashboard with real-time balance and earnings tracking
- ✅ Investment in hardware products (Ordinateur Bureau, PC Graphique, Serveur Cloud)
- ✅ Deposit management (Wave/Orange Money payment methods)
- ✅ Withdrawal requests
- ✅ Transaction history
- ✅ Profile management

### Admin Features
- ✅ Complete user management (view, suspend, block)
- ✅ Product management (create, edit, activate/deactivate)
- ✅ Deposit validation with receipt upload
- ✅ Withdrawal approval
- ✅ Announcements system
- ✅ Dashboard with statistics

### Automated System
- ✅ Daily earnings calculation via CRON job
- ✅ Automatic investment completion
- ✅ Secure password hashing
- ✅ Double withdrawal prevention

## Tech Stack

**Frontend:**
- HTML5
- CSS3 (with responsive design)
- Vanilla JavaScript
- No frameworks required

**Backend:**
- Node.js with Express.js
- MySQL database
- JWT authentication
- bcryptjs for password hashing
- node-cron for automatic jobs

**Color Scheme:**
- Primary Black: #0B0B0B
- Primary Blue: #0A3D91
- Green (Success): #18C964
- White: #FFFFFF

## Project Structure

```
sy-wealth/
├── public/
│   ├── index.html           # Homepage
│   ├── investments.html     # Investment products
│   ├── signup.html          # User registration
│   ├── login.html           # User login
│   ├── dashboard.html       # User dashboard
│   ├── admin.html           # Admin panel
│   ├── css/
│   │   └── style.css        # Main stylesheet
│   ├── js/
│   │   ├── main.js          # Shared functionality
│   │   ├── dashboard.js     # Dashboard logic
│   │   └── admin.js         # Admin panel logic
│   └── uploads/             # User deposit receipts
├── config/
│   └── database.js          # Database configuration
├── middleware/
│   └── auth.js              # Authentication middleware
├── routes/
│   ├── auth.js              # Authentication routes
│   ├── dashboard.js         # Dashboard routes
│   ├── investments.js       # Investment routes
│   ├── deposits.js          # Deposit routes
│   ├── withdrawals.js       # Withdrawal routes
│   ├── admin.js             # Admin routes
│   └── statistics.js        # Statistics routes
├── server.js                # Main server file
├── package.json             # Dependencies
├── .env                     # Environment variables
├── database-schema.sql      # Database setup script
└── README.md               # This file
```

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MySQL server
- npm or yarn

### Step 1: Database Setup

1. Open MySQL command line or MySQL Workbench
2. Run the SQL script:
   ```sql
   SOURCE path/to/database-schema.sql;
   ```

### Step 2: Environment Setup

1. Create `.env` file (already provided, but update values):
   ```
   PORT=3000
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=sy_wealth
   
   JWT_SECRET=your_jwt_secret_key_change_this
   ADMIN_PHONE=0707070707
   ADMIN_PASSWORD=admin123
   
   WAVE_PHONE=0707070707
   ORANGE_MONEY_PHONE=0707070707
   ```

### Step 3: Install Dependencies

```bash
npm install
```

### Step 4: Start Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

Server will run on http://localhost:3000

## Default Credentials

### Admin Login
- **Phone:** 0707070707
- **Password:** admin123

### Test User (Create via signup)
- Create a new account through the signup page

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/verify` - Verify token

### User Dashboard
- `GET /api/dashboard` - Get dashboard data
- `GET /api/statistics` - Get public statistics

### Investments
- `POST /api/investments/create` - Create investment
- `GET /api/investments/myinvestments` - Get user investments

### Deposits
- `POST /api/deposits/create` - Create deposit request
- `GET /api/deposits/mydeposits` - Get user deposits

### Withdrawals
- `POST /api/withdrawals/create` - Request withdrawal
- `GET /api/withdrawals/mywithdrawals` - Get withdrawal history

### Admin
- `GET /api/admin/dashboard` - Admin dashboard data
- `PUT /api/admin/deposits/:id/approve` - Approve deposit
- `PUT /api/admin/deposits/:id/reject` - Reject deposit
- `PUT /api/admin/withdrawals/:id/approve` - Approve withdrawal
- `PUT /api/admin/withdrawals/:id/reject` - Reject withdrawal
- `POST /api/admin/projects` - Create project
- `PUT /api/admin/projects/:id/toggle` - Toggle project status
- `PUT /api/admin/users/:id/suspend` - Suspend user
- `PUT /api/admin/users/:id/block` - Block user
- `POST /api/admin/announcements` - Create announcement
- `DELETE /api/admin/announcements/:id` - Delete announcement

## Daily Earnings System

The system automatically processes daily earnings at 00:00 (midnight) every day:

1. **Identify Active Investments** - Finds all active investments with remaining days
2. **Add Daily Gain** - Credits the daily gain amount to user balance
3. **Reduce Days** - Decrements days remaining by 1
4. **Complete Investments** - Marks investment as complete when days_remaining = 0
5. **Log Transactions** - Records all earnings in transaction history

This is handled by a CRON job in `server.js`:
```javascript
cron.schedule('0 0 * * *', async () => {
    // Daily processing logic
});
```

## Investment Products

### 1. Ordinateur Bureau
- Investment: 1,500 FCFA
- Daily Gain: 250 FCFA
- Duration: 30 days
- Total Profit: 7,500 FCFA

### 2. PC Graphique
- Investment: 3,000 FCFA
- Daily Gain: 550 FCFA
- Duration: 30 days
- Total Profit: 16,500 FCFA

### 3. Serveur Cloud
- Investment: 5,000 FCFA
- Daily Gain: 1,000 FCFA
- Duration: 30 days
- Total Profit: 30,000 FCFA

## Security Features

- **Password Hashing:** bcryptjs (salted hashing)
- **JWT Tokens:** Secure session management
- **Admin Authorization:** Role-based access control
- **Double Withdrawal Prevention:** Prevents multiple pending withdrawals
- **File Upload Validation:** Image size and type validation
- **CORS:** Cross-origin request protection
- **SQL Injection Prevention:** Parameterized queries

## File Structure Details

### Public Folder
- **HTML Pages:** All user-facing pages are static HTML
- **CSS:** Responsive design with mobile support
- **JavaScript:** Vanilla JS, no jQuery or frameworks
- **Uploads:** Stores user deposit receipt images

### Backend
- **Routes:** Modular route handlers for each feature
- **Middleware:** Authentication and authorization checks
- **Config:** Database and environment configuration

## Customization Guide

### Change Colors
Edit `public/css/style.css`:
```css
:root {
    --primary-black: #0B0B0B;
    --primary-blue: #0A3D91;
    --primary-green: #18C964;
    --primary-white: #FFFFFF;
}
```

### Add New Product
1. Insert into `projects` table in MySQL
2. Product will appear automatically on investments page

### Change Daily Earnings Schedule
Edit `server.js`, line with `cron.schedule`:
```javascript
// Current: 0 0 * * * (midnight)
// Change to: 30 18 * * * (6:30 PM)
```

## Troubleshooting

### Database Connection Issues
- Check MySQL is running: `mysql --version`
- Verify credentials in `.env` file
- Ensure database exists: `database-schema.sql` was executed

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### CORS Issues
- Check `server.js` has `cors()` middleware
- Verify frontend URL matches API calls

### JWT Token Errors
- Clear localStorage in browser
- Re-login to get new token
- Check JWT_SECRET in `.env`

## Support & Maintenance

### Regular Maintenance Tasks
1. Monitor database size
2. Archive old transactions (after 1 year)
3. Update Node.js dependencies: `npm update`
4. Review user activity logs

### Backup
```bash
# Backup database
mysqldump -u root -p sy_wealth > backup.sql

# Restore database
mysql -u root -p sy_wealth < backup.sql
```

## License
MIT License - Feel free to modify and distribute

## Contact
For support: contact@sywealth.com

---

**Last Updated:** April 2026
**Version:** 1.0.0
