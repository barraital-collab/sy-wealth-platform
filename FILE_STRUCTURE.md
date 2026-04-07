# SY Wealth - Complete Project File Structure

## 📁 Full Directory Tree

```
C:\Users\JEPORA\Desktop\SY\
│
├── 📄 server.js                          # Main API server (port 3000)
├── 📄 package.json                       # Node.js dependencies
├── 📄 .env                               # Environment configuration
├── 📄 database-schema.sql                # MySQL database setup script
│
├── 📄 README.md                          # Complete documentation
├── 📄 QUICK_START.md                     # 5-minute setup guide
├── 📄 DEPLOYMENT.md                      # Production deployment guide
├── 📄 ADMIN_GUIDE.md                     # Admin operations manual
├── 📄 PROJECT_SUMMARY.md                 # Project overview
│
├── 📁 config/
│   └── 📄 database.js                   # Database connection config
│
├── 📁 middleware/
│   └── 📄 auth.js                       # JWT authentication middleware
│
├── 📁 routes/
│   ├── 📄 auth.js                       # Authentication endpoints
│   ├── 📄 dashboard.js                  # User dashboard endpoints
│   ├── 📄 investments.js                # Investment endpoints
│   ├── 📄 deposits.js                   # Deposit endpoints
│   ├── 📄 withdrawals.js                # Withdrawal endpoints
│   ├── 📄 admin.js                      # Admin control endpoints
│   └── 📄 statistics.js                 # Statistics endpoints
│
└── 📁 public/                            # Frontend files (user-facing)
    ├── 📄 index.html                    # Homepage ⭐ START HERE
    ├── 📄 investments.html              # Investment products page
    ├── 📄 signup.html                   # User registration page
    ├── 📄 login.html                    # User login page
    ├── 📄 dashboard.html                # User dashboard/account
    ├── 📄 admin.html                    # Admin panel (requires admin login)
    │
    ├── 📁 css/
    │   └── 📄 style.css                 # All styling (responsive design)
    │
    ├── 📁 js/
    │   ├── 📄 main.js                   # Core shared JavaScript
    │   ├── 📄 dashboard.js              # Dashboard-specific logic
    │   └── 📄 admin.js                  # Admin panel logic
    │
    └── 📁 uploads/                      # User deposit receipts storage
        └── (files created at runtime)
```

---

## 📄 File Purpose Reference

### Root Level Files (Setup & Config)

| File | Purpose | Edit? |
|------|---------|-------|
| server.js | Main API server | ✏️ Yes - customize CRON |
| package.json | Node.js dependencies | ✏️ Only if adding packages |
| .env | Configuration variables | ✏️ YES - update for production |
| database-schema.sql | Database setup | ✏️ Only if changing schema |

### Documentation Files

| File | Purpose | When to Read |
|------|---------|-------------|
| README.md | Complete guide | First time setup |
| QUICK_START.md | Fast local setup | Getting started |
| DEPLOYMENT.md | Production setup | Before going live |
| ADMIN_GUIDE.md | Admin operations | For users managing platform |
| PROJECT_SUMMARY.md | File overview | Understanding project |

### Frontend Files (User Interface)

| File | Purpose | Users |
|------|---------|-------|
| index.html | Landing page | Everyone |
| investments.html | Product showcase | Everyone |
| signup.html | Register account | New users |
| login.html | Sign in | Existing users |
| dashboard.html | User account | Logged in users |
| admin.html | Admin panel | Admins only |

### Styling & Interaction

| File | Purpose | Contains |
|------|---------|----------|
| css/style.css | All styling | Colors, layout, responsive design |
| js/main.js | Core logic | Auth, API calls, utilities |
| js/dashboard.js | Dashboard logic | Investments, deposits, withdrawals |
| js/admin.js | Admin logic | User management, approvals |

### Backend API

| File | Handles | Routes |
|------|---------|--------|
| auth.js | User auth | signup, login, verify |
| dashboard.js | User data | Get dashboard data |
| investments.js | Investments | Create, list investments |
| deposits.js | Deposits | Create, list deposits |
| withdrawals.js | Withdrawals | Create, list withdrawals |
| admin.js | Admin ops | Users, projects, approvals |
| statistics.js | Stats | Public statistics |

### Configuration

| File | Contains | Edit For |
|------|----------|----------|
| config/database.js | DB connection | MySQL credentials |
| middleware/auth.js | JWT logic | Auth behavior |

### Data Storage

| Folder | Purpose | Created By |
|--------|---------|-----------|
| public/uploads/ | Deposit receipts | Users uploading receipts |

---

## 🔄 Data Flow

### User Signup Flow
```
signup.html → main.js → /api/auth/signup → auth.js → database
                          ↓
                       JWT token
                          ↓
                      localStorage
```

### Investment Flow
```
dashboard.html → dashboard.js → /api/investments/create
                                     ↓
                    investments.js route handler
                                     ↓
        Check balance → Deduct amount → Create record
                                     ↓
                              Return success
```

### Daily Earnings Flow
```
Midnight → server.js CRON job
              ↓
    Find all active investments
              ↓
    Add daily_gain to user balance
              ↓
    Reduce days_remaining by 1
              ↓
    Mark complete if days = 0
              ↓
    Log transaction
```

---

## 🎯 Important Files Summary

### Must Know (For Usage)
- **server.js** - Start the backend
- **index.html** - Start the frontend
- **admin.html** - Manage platform
- **.env** - Configuration

### Must Edit (For Customization)
- **.env** - Database credentials & API config
- **css/style.css** - Colors, fonts, layout
- **server.js** - CRON schedule, port
- **database-schema.sql** - Database structure

### Reference (For Understanding)
- **Routes/** - How API works
- **public/js/** - Frontend logic
- **README.md** - Full documentation

---

## 📊 Naming Convention

### HTML Files
- Lowercase with hyphens: `index.html`, `admin.html`

### JavaScript Files
- Uppercase for classes (not used here)
- Lowercase for functions: `loadUserData()`, `apiRequest()`

### Database Tables
- Snake_case: `users`, `investments`, `daily_earnings`

### Variables
- camelCase: `userId`, `projectId`, `userBalance`

### CSS Classes
- Kebab-case: `.primary-button`, `.active-section`

---

## 🔐 Security Files

Only these files handle sensitive data:
- `middleware/auth.js` - JWT token validation
- `routes/auth.js` - Password hashing
- `config/database.js` - DB credentials
- `.env` - Secret keys (NEVER commit to Git)

---

## 📦 Module Structure

### Main Dependencies
```
express           - Web framework
mysql2            - Database driver
jsonwebtoken      - JWT tokens
bcryptjs          - Password hashing
cors              - Cross-origin requests
node-cron         - Task scheduling
validator         - Input validation
multer            - File uploads
dotenv            - Environment variables
```

---

## 🚀 Typical Workflow

### To Start Development
1. Edit `.env` with local database
2. Run `npm run dev`
3. Open `http://localhost:3000`
4. Make changes to `public/` files
5. Changes auto-reload in browser

### To Go to Production
1. Follow DEPLOYMENT.md
2. Change values in `.env`
3. Run `npm start`
4. Use PM2 to manage process
5. Use Nginx for reverse proxy

### To Add Features
1. Add database table changes in `database-schema.sql`
2. Create new route in `routes/`
3. Add API endpoint to `server.js`
4. Add frontend HTML in `public/`
5. Add JavaScript logic in `public/js/`
6. Update CSS in `public/css/style.css`

---

## 📍 File Locations Summary

| Need | Location |
|------|----------|
| Start server | Root directory: `npm run dev` |
| View website | `public/index.html` or browser |
| Change colors | `public/css/style.css` (lines 1-20) |
| Change DB info | `.env` file |
| Update products | Update in database (`projects` table) |
| Admin panel | `public/admin.html` |
| API code | `routes/` directory |
| Frontend code | `public/` directory |
| Backend code | `*.js` files in root & `routes/` |

---

## ✅ Quick File Checklist

Missing anything? Check:
- [ ] server.js ..................... Main API server
- [ ] package.json .................. Dependencies installed?
- [ ] .env .......................... Configuration set?
- [ ] database-schema.sql ........... Database created?
- [ ] public/index.html ............ Frontend start
- [ ] public/admin.html ............ Admin panel
- [ ] config/database.js ........... Database config
- [ ] routes/*.js .................. 7 API route files
- [ ] middleware/auth.js ........... Auth middleware

---

## 📞 Need Help?

- **How to setup?** → QUICK_START.md
- **Full documentation?** → README.md
- **Deploy to production?** → DEPLOYMENT.md
- **Admin operations?** → ADMIN_GUIDE.md
- **File overview?** → This file
- **Project summary?** → PROJECT_SUMMARY.md

---

**Everything you need is in this directory. Happy coding! 🚀**
