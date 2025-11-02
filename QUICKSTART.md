# 🚀 Quick Start Guide - Deploy to Your Own Server

## Overview
This guide helps you deploy the Outbound Calling Bot to your own Ubuntu server.

---

## Prerequisites
- Ubuntu 20.04+ server with sudo access
- At least 4GB RAM
- Root or sudo access
- Internet connection

---

## Option 1: Automatic Installation (Recommended)

### Step 1: Get Your Code
```bash
# SSH into your server
ssh your-user@your-server-ip

# Clone your repository
git clone YOUR_GITHUB_REPO_URL /opt/callbot
cd /opt/callbot
```

### Step 2: Make Scripts Executable
```bash
chmod +x COMPLETE_SETUP.sh
chmod +x INSTALL_ASTERISK.sh
chmod +x INSTALL_SUPERVISOR.sh
```

### Step 3: Run Complete Setup
```bash
# This will install everything: Python, Node.js, Asterisk, Supervisor, Nginx
./COMPLETE_SETUP.sh
```

The script will:
- ✅ Install Python 3.11
- ✅ Install Node.js 18 & Yarn
- ✅ Install MySQL (optional)
- ✅ Install Asterisk (optional, takes 20-30 mins)
- ✅ Install Supervisor
- ✅ Install Nginx
- ✅ Setup backend & frontend
- ✅ Create .env files
- ✅ Configure Supervisor services

---

## Option 2: Manual Installation

### 1. Install Asterisk
```bash
cd /opt/callbot
chmod +x INSTALL_ASTERISK.sh
./INSTALL_ASTERISK.sh
```

Wait 20-30 minutes for compilation to complete.

### 2. Install Supervisor
```bash
chmod +x INSTALL_SUPERVISOR.sh
./INSTALL_SUPERVISOR.sh
```

### 3. Install Other Dependencies
```bash
# Python 3.11
sudo add-apt-repository -y ppa:deadsnakes/ppa
sudo apt update
sudo apt install -y python3.11 python3.11-venv python3.11-dev

# Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
npm install -g yarn

# Database
sudo apt install -y sqlite3  # or mysql-server
```

### 4. Setup Application
```bash
cd /opt/callbot

# Backend
cd backend
cp .env.example .env
nano .env  # Edit with your settings
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
deactivate

# Frontend
cd ../frontend
cp .env.example .env
nano .env  # Edit with your backend URL
yarn install
```

---

## Configuration Files Location

After installation, you'll find:

### ✅ Application Files
```
/opt/callbot/
├── backend/
│   ├── .env                    ← Configure this!
│   ├── server.py
│   └── requirements.txt
├── frontend/
│   ├── .env                    ← Configure this!
│   └── package.json
└── asterisk_config_sample.conf ← Use this for Asterisk
```

### ✅ Asterisk Configuration
```
/etc/asterisk/
├── manager.conf                ← Configure AMI here
├── extensions.conf             ← Configure dialplan here
└── sip.conf                    ← Configure SIP trunk here
```

### ✅ Supervisor Configuration
```
/etc/supervisor/
└── conf.d/
    ├── callbot-backend.conf    ← Auto-created
    └── callbot-frontend.conf   ← Auto-created
```

---

## Required Configurations

### 1. Backend Configuration: `/opt/callbot/backend/.env`

**Edit this file:**
```bash
nano /opt/callbot/backend/.env
```

**Update these values:**
```bash
# Use MySQL or SQLite
USE_MYSQL=false  # Change to true if using MySQL

# Asterisk Settings (REQUIRED)
ASTERISK_HOST=127.0.0.1         # Your Asterisk server IP
ASTERISK_PORT=5038
ASTERISK_USERNAME=admin         # Your AMI username
ASTERISK_PASSWORD=your_password # Your AMI password

# SIP Settings (REQUIRED)
SIP_TRUNK_NAME=your_trunk       # Your actual trunk name
DEFAULT_CALLER_ID=1234567890    # Your caller ID
```

### 2. Frontend Configuration: `/opt/callbot/frontend/.env`

**Edit this file:**
```bash
nano /opt/callbot/frontend/.env
```

**Update:**
```bash
REACT_APP_BACKEND_URL=http://your-server-ip:8001
# Or for production: https://yourdomain.com
```

### 3. Asterisk AMI Configuration: `/etc/asterisk/manager.conf`

**Edit this file:**
```bash
sudo nano /etc/asterisk/manager.conf
```

**Add/Update:**
```ini
[general]
enabled = yes
port = 5038
bindaddr = 0.0.0.0

[admin]
secret = your_password
read = all
write = all
```

**Reload Asterisk:**
```bash
sudo asterisk -rx "manager reload"
```

### 4. Asterisk Dialplan: `/etc/asterisk/extensions.conf`

**Edit this file:**
```bash
sudo nano /etc/asterisk/extensions.conf
```

**Add this context (copy from asterisk_config_sample.conf):**
```ini
[outbound_campaign]
exten => _X.,1,NoOp(*** Outbound Campaign Call ***)
same => n,Answer()
same => n,Wait(1)
same => n,Playback(hello-world)
same => n,Read(DTMF_RESPONSE,beep,1,,1,5)
same => n,UserEvent(CALL_RESPONSE,DTMF:${DTMF_RESPONSE})
same => n,Hangup()
```

**Reload dialplan:**
```bash
sudo asterisk -rx "dialplan reload"
```

---

## Start the Application

### Start Services
```bash
# Start backend
sudo supervisorctl start callbot-backend

# Start frontend
sudo supervisorctl start callbot-frontend

# Check status
sudo supervisorctl status
```

### Expected Output:
```
callbot-backend    RUNNING   pid 1234, uptime 0:00:10
callbot-frontend   RUNNING   pid 1235, uptime 0:00:10
```

---

## Verify Installation

### 1. Check Backend API
```bash
curl http://localhost:8001/api/
# Should return: {"message":"Outbound Calling Bot API","version":"1.0.0"}
```

### 2. Check Frontend
Open browser: `http://your-server-ip:3000`

### 3. Check Asterisk
```bash
sudo asterisk -rvvv
# In Asterisk CLI:
manager show connected
dialplan show outbound_campaign
```

### 4. Check Logs
```bash
# Backend logs
sudo tail -f /var/log/supervisor/callbot-backend.log

# Frontend logs
sudo tail -f /var/log/supervisor/callbot-frontend.log

# Asterisk logs
sudo tail -f /var/log/asterisk/full
```

---

## Common Issues & Solutions

### ❌ "Cannot find .env files"
**Solution:**
```bash
cd /opt/callbot/backend
cp .env.example .env
nano .env

cd /opt/callbot/frontend
cp .env.example .env
nano .env
```

### ❌ "/etc/asterisk not found"
**Solution:** Asterisk not installed. Run:
```bash
./INSTALL_ASTERISK.sh
```

### ❌ "/etc/supervisor not found"
**Solution:** Supervisor not installed. Run:
```bash
./INSTALL_SUPERVISOR.sh
```

### ❌ "Backend not starting"
**Solution:** Check logs and database:
```bash
sudo tail -f /var/log/supervisor/callbot-backend-error.log
```

### ❌ "Can't connect to Asterisk AMI"
**Solution:** 
1. Check Asterisk is running: `sudo systemctl status asterisk`
2. Test AMI: `telnet localhost 5038`
3. Check credentials in `/opt/callbot/backend/.env`
4. Verify `/etc/asterisk/manager.conf`

---

## Quick Commands Reference

```bash
# Check all services
sudo supervisorctl status

# Restart services
sudo supervisorctl restart callbot-backend
sudo supervisorctl restart callbot-frontend

# View logs
sudo tail -f /var/log/supervisor/callbot-backend.log

# Asterisk CLI
sudo asterisk -rvvv

# Reload Asterisk configs
sudo asterisk -rx "manager reload"
sudo asterisk -rx "dialplan reload"

# Check ports
sudo netstat -tlnp | grep -E '3000|8001|5038'
```

---

## Production Setup (Optional)

### Install SSL Certificate
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

### Configure Nginx Reverse Proxy
See `DEPLOYMENT_GUIDE.md` for complete Nginx configuration.

---

## Need Help?

1. Check logs first: `sudo tail -f /var/log/supervisor/callbot-*.log`
2. Verify configurations in `.env` files
3. Test Asterisk: `sudo asterisk -rvvv`
4. Review `DEPLOYMENT_GUIDE.md` for detailed troubleshooting

---

## Summary

✅ **After setup, you should have:**
- Backend running on port 8001
- Frontend running on port 3000
- Asterisk running with AMI enabled
- Supervisor managing both services
- SQLite database at `/opt/callbot/backend/callbot.db`

✅ **Configuration files:**
- `/opt/callbot/backend/.env` (created from .env.example)
- `/opt/callbot/frontend/.env` (created from .env.example)
- `/etc/asterisk/manager.conf` (configure AMI)
- `/etc/asterisk/extensions.conf` (configure dialplan)

🚀 **Access your application:** `http://your-server-ip:3000`
