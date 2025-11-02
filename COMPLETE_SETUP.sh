#!/bin/bash
# Complete Server Setup Script for Outbound Calling Bot
# Run this script on your Ubuntu server

set -e  # Exit on any error

echo "=========================================="
echo "Outbound Calling Bot - Server Setup"
echo "=========================================="
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    echo "Please do not run as root. Run as a regular user with sudo privileges."
    exit 1
fi

# Variables
APP_DIR="/opt/callbot"
REPO_URL="YOUR_GITHUB_REPO_URL_HERE"  # Replace with your GitHub repo

echo "Step 1: System Update"
echo "=========================================="
sudo apt update && sudo apt upgrade -y

echo ""
echo "Step 2: Install Essential Tools"
echo "=========================================="
sudo apt install -y build-essential curl wget git vim software-properties-common

echo ""
echo "Step 3: Install Python 3.11"
echo "=========================================="
sudo add-apt-repository -y ppa:deadsnakes/ppa
sudo apt update
sudo apt install -y python3.11 python3.11-venv python3.11-dev python3-pip

echo ""
echo "Step 4: Install Node.js 18.x and Yarn"
echo "=========================================="
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g yarn

echo ""
echo "Step 5: Install SQLite (default database)"
echo "=========================================="
sudo apt install -y sqlite3

echo ""
echo "Step 6: Install MySQL (optional - for production)"
echo "=========================================="
read -p "Do you want to install MySQL? (y/n): " install_mysql
if [ "$install_mysql" = "y" ]; then
    sudo apt install -y mysql-server
    echo "MySQL installed. Run 'sudo mysql_secure_installation' to secure it."
    echo "Then create database:"
    echo "  sudo mysql -u root -p"
    echo "  CREATE DATABASE callbot_db;"
    echo "  CREATE USER 'callbot_user'@'localhost' IDENTIFIED BY 'your_password';"
    echo "  GRANT ALL PRIVILEGES ON callbot_db.* TO 'callbot_user'@'localhost';"
    echo "  FLUSH PRIVILEGES;"
fi

echo ""
echo "Step 7: Install Asterisk"
echo "=========================================="
read -p "Do you want to install Asterisk now? (y/n) [This takes 20-30 minutes]: " install_asterisk
if [ "$install_asterisk" = "y" ]; then
    bash /opt/callbot/INSTALL_ASTERISK.sh
else
    echo "Skipping Asterisk installation. You can install it later with:"
    echo "  bash /opt/callbot/INSTALL_ASTERISK.sh"
fi

echo ""
echo "Step 8: Install Supervisor"
echo "=========================================="
sudo apt install -y supervisor
sudo systemctl enable supervisor
sudo systemctl start supervisor

echo ""
echo "Step 9: Install Nginx"
echo "=========================================="
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx

echo ""
echo "Step 10: Clone Application"
echo "=========================================="
if [ -d "$APP_DIR" ]; then
    echo "Directory $APP_DIR already exists. Skipping clone."
else
    sudo mkdir -p $APP_DIR
    sudo chown $USER:$USER $APP_DIR
    echo "Enter your GitHub repository URL:"
    read -p "Repository URL: " REPO_URL
    git clone $REPO_URL $APP_DIR
fi

echo ""
echo "Step 11: Setup Backend"
echo "=========================================="
cd $APP_DIR/backend

# Create .env from example
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "Created .env file. Please edit it with your credentials:"
    echo "  nano $APP_DIR/backend/.env"
fi

# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
deactivate

echo ""
echo "Step 12: Setup Frontend"
echo "=========================================="
cd $APP_DIR/frontend

# Create .env from example
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "Created frontend .env file."
fi

yarn install

echo ""
echo "Step 13: Create Supervisor Configuration"
echo "=========================================="

# Backend supervisor config
sudo tee /etc/supervisor/conf.d/callbot-backend.conf > /dev/null <<EOF
[program:callbot-backend]
directory=$APP_DIR/backend
command=$APP_DIR/backend/venv/bin/python -m uvicorn server:app --host 0.0.0.0 --port 8001
user=$USER
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/supervisor/callbot-backend.log
stderr_logfile=/var/log/supervisor/callbot-backend-error.log
environment=PATH="$APP_DIR/backend/venv/bin"
EOF

# Frontend supervisor config
sudo tee /etc/supervisor/conf.d/callbot-frontend.conf > /dev/null <<EOF
[program:callbot-frontend]
directory=$APP_DIR/frontend
command=/usr/bin/yarn start
user=$USER
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/supervisor/callbot-frontend.log
stderr_logfile=/var/log/supervisor/callbot-frontend-error.log
environment=PORT="3000"
EOF

# Reload supervisor
sudo supervisorctl reread
sudo supervisorctl update

echo ""
echo "=========================================="
echo "Installation Complete!"
echo "=========================================="
echo ""
echo "Next Steps:"
echo ""
echo "1. Configure Backend:"
echo "   nano $APP_DIR/backend/.env"
echo "   Update: ASTERISK_HOST, ASTERISK_PASSWORD, SIP_TRUNK_NAME"
echo ""
echo "2. Configure Frontend:"
echo "   nano $APP_DIR/frontend/.env"
echo "   Update: REACT_APP_BACKEND_URL"
echo ""
echo "3. Configure Asterisk AMI:"
echo "   sudo nano /etc/asterisk/manager.conf"
echo "   (See asterisk_config_sample.conf for example)"
echo ""
echo "4. Configure Asterisk Dialplan:"
echo "   sudo nano /etc/asterisk/extensions.conf"
echo "   (See asterisk_config_sample.conf for example)"
echo ""
echo "5. Start Services:"
echo "   sudo supervisorctl start callbot-backend"
echo "   sudo supervisorctl start callbot-frontend"
echo ""
echo "6. Check Status:"
echo "   sudo supervisorctl status"
echo ""
echo "7. Access Application:"
echo "   http://$(hostname -I | awk '{print $1}'):3000"
echo ""
echo "For detailed instructions, see: $APP_DIR/DEPLOYMENT_GUIDE.md"
