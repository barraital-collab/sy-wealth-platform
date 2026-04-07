# SY Wealth - Admin Guide

## Admin Panel Overview

The admin panel is the central hub for managing the entire SY Wealth platform. Only users with the 'admin' role can access it.

## Accessing Admin Panel

1. Navigate to: `http://localhost:3000/admin.html` (or your domain /admin.html)
2. Login with admin credentials:
   - **Phone:** 0707070707
   - **Password:** admin123 (change this immediately in production!)

## Admin Dashboard

### Key Metrics

**Total Users** - Count of all registered users on platform

**Pending Deposits** - Number of deposit requests awaiting approval

**Pending Withdrawals** - Number of withdrawal requests awaiting approval

**Daily Profit** - Sum of all earnings distributed today

## User Management

### Features
- View all users and their profiles
- View user balance
- Suspend user account (user cannot login)
- Block user account (permanent suspension)
- View user registration date

### Actions

**View Profile**
- Shows user name, phone, and current balance
- Used for verification and troubleshooting

**Suspend Account**
- Temporarily disables user login
- User can request reactivation
- Reversible action

**Block Account**
- Permanently removes user access
- User cannot recover access without admin intervention
- Use for fraudulent accounts

### Best Practices
- Always verify user before taking action
- Document reason for suspension/blocking
- Inform user of action taken (via email if possible)

## Product Management

### Default Products

1. **Ordinateur Bureau** - 1,500 FCFA, 250 FCFA/day
2. **PC Graphique** - 3,000 FCFA, 550 FCFA/day
3. **Serveur Cloud** - 5,000 FCFA, 1,000 FCFA/day

### Create New Product

1. Click "Ajouter un produit" button
2. Fill in details:
   - **Nom du produit** - Product name
   - **Montant d'investissement** - Investment amount
   - **Gain quotidien** - Daily earnings
   - **Durée** - Duration in days
3. Click "Créer"

### Edit Product

Click "Éditer" to modify product details
(Can only modify name; amount and gains need new product)

### Activate/Deactivate Product

- Click "Désactiver" to stop new investments
- Click "Activer" to re-enable
- Existing investments continue regardless of status

## Deposit Management

### Pending Deposits

Shows all deposits waiting for approval with:
- User name
- Deposit amount
- Payment method (Wave/Orange Money)
- Submission date

### Approval Process

**Step 1: Verify Deposit**
- Check receipt image matches amount
- Confirm payment method
- Verify sender phone in payment system

**Step 2: Approve Deposit**
- Click "Valider" button
- System automatically:
  - Credits user balance with deposit amount
  - Marks deposit as approved
  - Logs transaction
  - Notifies user

**Step 3: Reject Deposit (if fraudulent)**
- Click "Rejeter" button
- Deposit marked as rejected
- Amount NOT credited
- User notified

### Important
⚠️ Always verify receipts before approval!
⚠️ Keep records of all deposit verifications

## Withdrawal Management

### Pending Withdrawals

Shows all withdrawal requests with:
- User name
- Withdrawal amount
- Payment method
- Submission date

### Approval Process

**Step 1: Verify Request**
- Check user has sufficient balance
- Confirm withdrawal method
- Verify phone number ownership

**Step 2: Approve Withdrawal**
- Click "Valider paiement" button
- System automatically:
  - Deducts amount from user balance
  - Marks withdrawal as approved
  - Logs transaction
  - Notifies user

You must manually send the payment via Wave/Orange Money to the provided phone number.

**Step 3: Reject Withdrawal**
- Click "Rejeter demande" button
- Amount returned to user balance
- User notified

### Important
⚠️ Never approve withdrawal without capacity to pay
⚠️ Always send payment within 24 hours of approval

## Announcements

### Broadcast Messages

Use this to communicate important updates to all users:

1. Click in content area
2. Enter title and message
3. Click "Publier"
4. Message appears to all users on dashboard

### Example Announcements
- System maintenance notices
- New product launches
- Payment method changes
- Policy updates

### Delete Announcement
- Click "Supprimer" on old announcement
- Permanently removed

## Security & Account Settings

### Change Admin Password

1. In admin account on system
2. Run: `UPDATE users SET password='$2a$10$...' WHERE id=1;`
3. Or create new admin account

### Create Additional Admin

1. Use signup but modify database:
```sql
UPDATE users SET role='admin' WHERE id=X;
```

### Admin Access Log

Monitor who accessed admin panel:
```sql
SELECT * FROM transactions WHERE type='admin_action' 
ORDER BY created_at DESC;
```

(Note: Currently all admin actions are logged in investment/transaction history)

## Financial Reports

### Daily Summary
```sql
SELECT 
    DATE(created_at) as date,
    COUNT(DISTINCT user_id) as active_users,
    SUM(CASE WHEN type = 'earnings' THEN amount ELSE 0 END) as total_earnings,
    SUM(CASE WHEN type = 'deposit' THEN amount ELSE 0 END) as total_deposits,
    SUM(CASE WHEN type = 'withdrawal' THEN amount ELSE 0 END) as total_withdrawals
FROM transactions
WHERE DATE(created_at) = CURDATE()
GROUP BY DATE(created_at);
```

### User Balances
```sql
SELECT name, phone, balance, created_at 
FROM users 
WHERE role = 'user' 
ORDER BY balance DESC
LIMIT 20;
```

### Active Investments
```sql
SELECT u.name, p.name as product, i.amount, i.days_remaining
FROM investments i
JOIN users u ON i.user_id = u.id
JOIN projects p ON i.project_id = p.id
WHERE i.status = 'active'
ORDER BY i.created_at DESC;
```

## Common Tasks

### Verify Payment Method Details

Store these in .env file:
- **Wave:** 0707070707
- **Orange Money:** 0707070707

### Handle Disputed Withdrawal

1. Check transaction history
2. Verify if payment was sent
3. Contact user to confirm
4. If user didn't receive: reverse and re-send
5. If user received: provide proof

### Investigate Suspicious Account

1. View user profile
2. Check transaction history
3. Review all deposits and withdrawals
4. Look for patterns (rapid deposits/withdrawals)
5. Block if confirmed fraudulent

## Daily Checklist

- [ ] Review pending deposits
- [ ] Review pending withdrawals
- [ ] Check daily statistics
- [ ] Verify all approved payments were sent
- [ ] Monitor user complaints
- [ ] Archive old announcements
- [ ] Backup database

## Weekly Tasks

- [ ] Review user account activity
- [ ] Check for suspicious patterns
- [ ] Verify all investments running correctly
- [ ] Update announcements if needed
- [ ] Review financial reports
- [ ] Check system logs for errors

## Monthly Tasks

- [ ] Archive completed investments
- [ ] Review user retention metrics
- [ ] Plan new products if needed
- [ ] Review and update policies
- [ ] Database optimization
- [ ] Full system backup and test restore

## Troubleshooting

### User Claims They Didn't Receive Payment

1. Check withdrawal was approved
2. Search payment method records (Wave/Orange Money)
3. If found: ask user to wait 24-48 hours
4. If not found: reverse withdrawal and re-process

### Duplicate Deposit

1. Check transaction history
2. If same amount within minutes: likely system glitch
3. Reject duplicate deposit
4. Notify user

### Blocked User Wants Access

1. Verify reason for block
2. Determine if unblock is appropriate
3. Update status: `UPDATE users SET status = 'active' WHERE id = X;`
4. Reset password if needed

## Support & Escalation

For issues beyond admin panel:
- Contact: contact@sywealth.com
- Support Hours: 24/7
- Response Time: Within 4 hours

---

**Last Updated:** April 2026
**AdminGuide Version:** 1.0
