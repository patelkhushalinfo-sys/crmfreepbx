# Outbound Calling Bot - Deployment Guide

## Complete guide to deploy on your own server

---

## Server Requirements

### Minimum Hardware
- **CPU**: 2 cores (4+ recommended for production)
- **RAM**: 4GB (8GB+ recommended)
- **Storage**: 20GB SSD
- **Network**: Static IP address, open ports

### Supported Operating Systems
- Ubuntu 20.04 LTS / 22.04 LTS / 24.04 LTS (Recommended)
- Debian 10/11
- CentOS 7/8
- Red Hat Enterprise Linux 8+

---

## Pre-Installation Requirements

### 1. System Update
```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Install Essential Build Tools
```bash
sudo apt install -y build-essential curl wget git vim
```

### 3. Install Python 3.11+ (Backend)
```bash
# Check if Python 3.11+ is installed
python3 --version

# If not, install Python 3.11
sudo apt install -y software-properties-common
sudo add-apt-repository -y ppa:deadsnakes/ppa
sudo apt update
sudo apt install -y python3.11 python3.11-venv python3.11-dev python3-pip
```

### 4. Install Node.js 18+ and Yarn (Frontend)
```bash
# Install Node.js 18.x LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Yarn
npm install -g yarn

# Verify installations
node --version  # Should be v18.x or higher
yarn --version
```

### 5. Install Database (Choose One)

#### Option A: SQLite (Development/Small Scale)
```bash
sudo apt install -y sqlite3
```

#### Option B: MySQL (Production Recommended)
```bash
# Install MySQL Server
sudo apt install -y mysql-server

# Secure MySQL installation
sudo mysql_secure_installation

# Create database and user
sudo mysql -u root -p
```

```sql
CREATE DATABASE callbot_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'callbot_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON callbot_db.* TO 'callbot_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 6. Install Asterisk/FreePBX

#### Option A: Install Asterisk from Source
```bash
# Install dependencies
sudo apt install -y build-essential libxml2-dev libncurses5-dev \
  libsqlite3-dev uuid-dev libjansson-dev libssl-dev

# Download and install Asterisk 20
cd /usr/src
sudo wget https://downloads.asterisk.org/pub/telephony/asterisk/asterisk-20-current.tar.gz
sudo tar -xvzf asterisk-20-current.tar.gz
cd asterisk-20*/

# Configure and compile
sudo contrib/scripts/install_prereq install
sudo ./configure
sudo make menuselect  # Select desired modules
sudo make -j$(nproc)
sudo make install
sudo make samples
sudo make config

# Start Asterisk
sudo systemctl start asterisk
sudo systemctl enable asterisk
```

#### Option B: Install FreePBX (Complete PBX Solution)
```bash
# Follow FreePBX installation guide for Ubuntu:
# https://www.freepbx.org/get-started/
```

### 7. Install Supervisor (Process Manager)
```bash
sudo apt install -y supervisor
sudo systemctl enable supervisor
sudo systemctl start supervisor
```

### 8. Install Nginx (Web Server - Optional but Recommended)
```bash
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

---

## Application Deployment Steps

### Step 1: Clone Your Repository
```bash
# Create application directory
sudo mkdir -p /opt/callbot
sudo chown $USER:$USER /opt/callbot

# Clone from GitHub
cd /opt/callbot
git clone https://github.com/your-username/your-repo.git .
```

### Step 2: Backend Setup

#### Install Python Dependencies
```bash
cd /opt/callbot/backend

# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate

# Install requirements
pip install --upgrade pip
pip install -r requirements.txt
```

#### Configure Backend Environment
```bash
# Create .env file
nano /opt/callbot/backend/.env
```

Add the following configuration:
```bash
# Database Configuration
USE_MYSQL=true  # Set to false for SQLite
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=callbot_user
MYSQL_PASSWORD=your_secure_password
MYSQL_DATABASE=callbot_db

# Asterisk AMI Configuration
ASTERISK_HOST=127.0.0.1  # Your Asterisk server IP
ASTERISK_PORT=5038
ASTERISK_USERNAME=admin
ASTERISK_PASSWORD=your_ami_password

# SIP Configuration
SIP_TRUNK_NAME=your_trunk_name
DEFAULT_CALLER_ID=your_caller_id

# CORS (adjust based on your domain)
CORS_ORIGINS=https://yourdomain.com,http://localhost:3000
```

#### Test Backend
```bash
# Activate virtual environment
source /opt/callbot/backend/venv/bin/activate

# Run backend manually to test
cd /opt/callbot/backend
python server.py

# Should see: "Uvicorn running on http://0.0.0.0:8001"
# Press Ctrl+C to stop
```

### Step 3: Frontend Setup

#### Install Dependencies
```bash
cd /opt/callbot/frontend
yarn install
```

#### Configure Frontend Environment
```bash
# Create .env file
nano /opt/callbot/frontend/.env
```

Add the following:
```bash
REACT_APP_BACKEND_URL=http://your-server-ip:8001
# Or for production with nginx: https://yourdomain.com
```

#### Build Frontend for Production
```bash
cd /opt/callbot/frontend
yarn build
```

### Step 4: Configure Supervisor

Create backend service:
```bash
sudo nano /etc/supervisor/conf.d/callbot-backend.conf
```

```ini
[program:callbot-backend]
directory=/opt/callbot/backend
command=/opt/callbot/backend/venv/bin/python -m uvicorn server:app --host 0.0.0.0 --port 8001
user=www-data
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/supervisor/callbot-backend.log
stderr_logfile=/var/log/supervisor/callbot-backend-error.log
environment=PATH="/opt/callbot/backend/venv/bin"
```

Create frontend service:
```bash
sudo nano /etc/supervisor/conf.d/callbot-frontend.conf
```

```ini
[program:callbot-frontend]
directory=/opt/callbot/frontend
command=/usr/bin/yarn start
user=www-data
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/supervisor/callbot-frontend.log
stderr_logfile=/var/log/supervisor/callbot-frontend-error.log
environment=PORT="3000"
```

Reload supervisor:
```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start callbot-backend
sudo supervisorctl start callbot-frontend

# Check status
sudo supervisorctl status
```

### Step 5: Configure Asterisk

#### Enable AMI
```bash
sudo nano /etc/asterisk/manager.conf
```

Add/modify:
```ini
[general]
enabled = yes
port = 5038
bindaddr = 0.0.0.0

[admin]
secret = your_ami_password
read = all
write = all
```

#### Configure Dialplan
```bash
sudo nano /etc/asterisk/extensions.conf
```

Add the outbound campaign context (use the provided `asterisk_config_sample.conf`):
```ini
[outbound_campaign]
exten => _X.,1,NoOp(*** Outbound Campaign Call ***)
same => n,Set(CAMPAIGN_ID=${CALLERID(num)})
same => n,Answer()
same => n,Wait(1)
same => n,Playback(hello-world)
same => n,Read(DTMF_RESPONSE,beep,1,,1,5)
same => n,NoOp(DTMF: ${DTMF_RESPONSE})
same => n,UserEvent(CALL_RESPONSE,CampaignID:${CAMPAIGN_ID},DTMF:${DTMF_RESPONSE})
same => n,Hangup()
```

Reload Asterisk:
```bash
sudo asterisk -rx "manager reload"
sudo asterisk -rx "dialplan reload"
```

### Step 6: Configure Nginx (Production)

For production deployment with SSL:

```bash
sudo nano /etc/nginx/sites-available/callbot
```

```nginx
# Backend API
upstream backend_api {
    server 127.0.0.1:8001;
}

# Frontend
upstream frontend_app {
    server 127.0.0.1:3000;
}

server {
    listen 80;
    server_name yourdomain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    # SSL Configuration (use Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # API Backend
    location /api {
        proxy_pass http://backend_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Frontend
    location / {
        proxy_pass http://frontend_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/callbot /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Step 7: Install SSL Certificate (Let's Encrypt)
```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal is set up automatically
```

---

## Firewall Configuration

### Open Required Ports
```bash
# Enable UFW
sudo ufw enable

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow Asterisk AMI (only from localhost or specific IPs)
sudo ufw allow from 127.0.0.1 to any port 5038

# Allow SIP (if needed)
sudo ufw allow 5060/udp
sudo ufw allow 10000:20000/udp  # RTP ports

# Check status
sudo ufw status
```

---

## Post-Deployment Verification

### 1. Check Services
```bash
# Check supervisor services
sudo supervisorctl status

# Check Asterisk
sudo asterisk -rx "core show version"
sudo asterisk -rx "manager show connected"

# Check Nginx
sudo systemctl status nginx

# Check MySQL (if used)
sudo systemctl status mysql
```

### 2. Test API
```bash
curl http://localhost:8001/api/
# Should return: {"message":"Outbound Calling Bot API","version":"1.0.0"}
```

### 3. Test Frontend
Open browser: `http://your-server-ip:3000` or `https://yourdomain.com`

### 4. Check Logs
```bash
# Backend logs
sudo tail -f /var/log/supervisor/callbot-backend.log

# Frontend logs
sudo tail -f /var/log/supervisor/callbot-frontend.log

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Asterisk logs
sudo tail -f /var/log/asterisk/full
```

---

## Production Optimizations

### 1. Use Production WSGI Server (Gunicorn)
```bash
# Install Gunicorn
pip install gunicorn

# Update supervisor config
command=/opt/callbot/backend/venv/bin/gunicorn server:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8001
```

### 2. Build Frontend with Production Settings
```bash
cd /opt/callbot/frontend
NODE_ENV=production yarn build

# Serve built files with Nginx
sudo nano /etc/nginx/sites-available/callbot
```

Update Nginx config to serve build folder:
```nginx
location / {
    root /opt/callbot/frontend/build;
    try_files $uri /index.html;
}
```

### 3. Enable Database Backups
```bash
# Create backup script
sudo nano /opt/callbot/backup.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/callbot/backups"
mkdir -p $BACKUP_DIR

# Backup MySQL
mysqldump -u callbot_user -p'your_password' callbot_db > $BACKUP_DIR/callbot_$DATE.sql

# Or backup SQLite
cp /opt/callbot/backend/callbot.db $BACKUP_DIR/callbot_$DATE.db

# Keep only last 7 days
find $BACKUP_DIR -mtime +7 -delete
```

```bash
chmod +x /opt/callbot/backup.sh

# Add to crontab (daily at 2 AM)
sudo crontab -e
0 2 * * * /opt/callbot/backup.sh
```

---

## Monitoring and Maintenance

### 1. Monitor System Resources
```bash
# Install htop
sudo apt install -y htop

# Monitor
htop
```

### 2. Monitor Call Quality
```bash
# Asterisk CLI
sudo asterisk -rvvv

# Check active calls
core show channels

# Check SIP peers
sip show peers
```

### 3. Log Rotation
```bash
sudo nano /etc/logrotate.d/callbot
```

```
/var/log/supervisor/callbot-*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
    sharedscripts
}
```

---

## Troubleshooting

### Backend Not Starting
```bash
# Check logs
sudo tail -f /var/log/supervisor/callbot-backend-error.log

# Test manually
cd /opt/callbot/backend
source venv/bin/activate
python server.py
```

### Database Connection Issues
```bash
# Test MySQL connection
mysql -u callbot_user -p callbot_db

# Check credentials in .env file
cat /opt/callbot/backend/.env
```

### Asterisk AMI Not Connecting
```bash
# Test AMI connection
telnet localhost 5038

# Check Asterisk manager
sudo asterisk -rx "manager show connected"

# Check firewall
sudo ufw status
```

### Frontend Not Loading
```bash
# Check if backend is accessible
curl http://localhost:8001/api/

# Check CORS settings in backend .env
# Update REACT_APP_BACKEND_URL in frontend .env
```

---

## Security Checklist

- [ ] Change all default passwords
- [ ] Use strong passwords for database and AMI
- [ ] Enable firewall (UFW)
- [ ] Install SSL certificate (Let's Encrypt)
- [ ] Restrict AMI access to localhost or specific IPs
- [ ] Regular security updates: `sudo apt update && sudo apt upgrade`
- [ ] Enable fail2ban for brute force protection
- [ ] Regular database backups
- [ ] Monitor logs for suspicious activity
- [ ] Use non-root user for application
- [ ] Disable SSH password authentication (use keys)

---

## Support and Maintenance

### Update Application
```bash
cd /opt/callbot
git pull origin main

# Update backend
cd backend
source venv/bin/activate
pip install -r requirements.txt
sudo supervisorctl restart callbot-backend

# Update frontend
cd ../frontend
yarn install
yarn build
sudo supervisorctl restart callbot-frontend
```

### Restart All Services
```bash
sudo supervisorctl restart callbot-backend callbot-frontend
sudo systemctl restart nginx
sudo asterisk -rx "core restart now"
```

---

## Quick Reference Commands

```bash
# View application status
sudo supervisorctl status

# Restart backend
sudo supervisorctl restart callbot-backend

# Restart frontend
sudo supervisorctl restart callbot-frontend

# View backend logs
sudo tail -f /var/log/supervisor/callbot-backend.log

# View Asterisk console
sudo asterisk -rvvv

# Reload Asterisk dialplan
sudo asterisk -rx "dialplan reload"

# Check database
mysql -u callbot_user -p callbot_db

# Check disk space
df -h

# Check memory usage
free -h
```

---

## Need Help?

1. Check logs first
2. Verify all configurations
3. Test components individually
4. Consult Asterisk documentation
5. Review application README

Good luck with your deployment! 🚀
