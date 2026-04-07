# SY Wealth - Deployment Guide

## Deployment to VPS/Linux Server

### Prerequisites
- VPS running Ubuntu 20.04 or later
- SSH access to server
- Domain name (optional but recommended)

### Step 1: Connect to VPS

```bash
ssh root@your_vps_ip
```

### Step 2: Update System

```bash
apt update
apt upgrade -y
```

### Step 3: Install Node.js

```bash
# Install Node.js (LTS version)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs
node --version
npm --version
```

### Step 4: Install MySQL

```bash
apt install -y mysql-server
mysql --version

# Secure MySQL installation
mysql_secure_installation
```

### Step 5: Clone Project

```bash
cd /var/www
git clone <your-repo-url> sy-wealth
cd sy-wealth
```

Or upload files via SFTP if not using Git.

### Step 6: Install Dependencies

```bash
npm install
```

### Step 7: Setup Database

```bash
# Login to MySQL
mysql -u root -p

# Run SQL script
SOURCE /var/www/sy-wealth/database-schema.sql;
EXIT;
```

### Step 8: Configure Environment

```bash
# Edit .env file
nano .env
```

Update with production values:
```
PORT=3000
NODE_ENV=production
DB_HOST=localhost
DB_USER=sy_wealth_user
DB_PASSWORD=strong_password_here
DB_NAME=sy_wealth
JWT_SECRET=generate_a_long_random_string_here
```

### Step 9: Install PM2 (Process Manager)

```bash
npm install -g pm2

# Start server with PM2
pm2 start server.js --name "sy-wealth-api"

# Make PM2 autostart on reboot
pm2 startup systemd
pm2 save
```

### Step 10: Setup Nginx Reverse Proxy

```bash
apt install -y nginx

# Create Nginx config
nano /etc/nginx/sites-available/sy-wealth
```

Paste this config:
```nginx
server {
    listen 80;
    server_name your_domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable site:
```bash
ln -s /etc/nginx/sites-available/sy-wealth /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### Step 11: SSL Certificate (Let's Encrypt)

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d your_domain.com
```

### Step 12: Verify Deployment

```bash
# Check PM2 status
pm2 status

# Check Nginx
systemctl status nginx

# Check logs
pm2 logs sy-wealth-api

# Test API
curl http://localhost:3000/api/health
```

## Production Checklist

- [ ] Change JWT_SECRET to a strong random value
- [ ] Update database credentials
- [ ] Set NODE_ENV=production
- [ ] Use HTTPS (SSL certificate)
- [ ] Setup automated backups
- [ ] Enable firewall (UFW)
- [ ] Monitor server resources
- [ ] Setup log rotation
- [ ] Test all features
- [ ] Setup email notifications
- [ ] Document backup procedure

## Firewall Setup (UFW)

```bash
ufw enable
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw status
```

## Database Backup

```bash
# Create backup script
nano backup.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/sy-wealth"
DATE=$(date +%Y-%m-%d)

mkdir -p $BACKUP_DIR
mysqldump -u sy_wealth_user -p sy_wealth > $BACKUP_DIR/sy_wealth_$DATE.sql

# Keep only last 30 days
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
```

Make executable and schedule with cron:
```bash
chmod +x backup.sh
0 2 * * * /var/www/sy-wealth/backup.sh
```

## Monitoring

### Check Server Resources
```bash
top
df -h
free -m
```

### Check MongoDB Connection
```bash
mysql -u sy_wealth_user -p sy_wealth -e "SELECT COUNT(*) FROM users;"
```

### View Logs
```bash
pm2 logs sy-wealth-api
tail -f /var/log/nginx/error.log
```

## Updates & Maintenance

### Update Dependencies
```bash
cd /var/www/sy-wealth
npm update
pm2 restart sy-wealth-api
```

### Restart Server
```bash
pm2 restart sy-wealth-api
```

### Stop Server
```bash
pm2 stop sy-wealth-api
```

### Search Issues on VPS

Keep an eye on:
- Node.js memory usage
- Database connections
- File upload size
- API response times

---

**Happy Hosting! 🚀**
