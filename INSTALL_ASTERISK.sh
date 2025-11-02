#!/bin/bash
# Asterisk Installation Script for Ubuntu/Debian

echo "=== Installing Asterisk 20 ==="

# Update system
sudo apt update && sudo apt upgrade -y

# Install dependencies
echo "Installing dependencies..."
sudo apt install -y build-essential wget libssl-dev libncurses5-dev \
  libnewt-dev libxml2-dev linux-headers-$(uname -r) libsqlite3-dev \
  uuid-dev libjansson-dev

# Download Asterisk
cd /usr/src
sudo wget https://downloads.asterisk.org/pub/telephony/asterisk/asterisk-20-current.tar.gz

# Extract
sudo tar -xvzf asterisk-20-current.tar.gz
cd asterisk-20*/

# Install prerequisites
sudo contrib/scripts/get_mp3_source.sh
sudo contrib/scripts/install_prereq install

# Configure
echo "Configuring Asterisk..."
sudo ./configure --with-jansson-bundled

# Select modules (using defaults)
sudo make menuselect.makeopts
sudo menuselect/menuselect \
  --enable app_macro \
  --enable format_mp3 \
  --enable CORE-SOUNDS-EN-GSM \
  --enable MOH-OPSOUND-GSM \
  menuselect.makeopts

# Compile (this may take 10-20 minutes)
echo "Compiling Asterisk (this may take 10-20 minutes)..."
sudo make -j$(nproc)

# Install
echo "Installing Asterisk..."
sudo make install
sudo make samples
sudo make config
sudo ldconfig

# Create asterisk user
sudo groupadd asterisk
sudo useradd -r -d /var/lib/asterisk -g asterisk asterisk
sudo usermod -aG audio,dialout asterisk

# Set permissions
sudo chown -R asterisk:asterisk /etc/asterisk
sudo chown -R asterisk:asterisk /var/{lib,log,spool}/asterisk
sudo chown -R asterisk:asterisk /usr/lib/asterisk

# Configure Asterisk to run as asterisk user
sudo sed -i 's/#AST_USER="asterisk"/AST_USER="asterisk"/' /etc/default/asterisk
sudo sed -i 's/#AST_GROUP="asterisk"/AST_GROUP="asterisk"/' /etc/default/asterisk

# Start Asterisk
sudo systemctl start asterisk
sudo systemctl enable asterisk

# Check status
echo ""
echo "=== Asterisk Installation Complete ==="
sudo systemctl status asterisk --no-pager

echo ""
echo "To access Asterisk CLI, run: sudo asterisk -rvvv"
echo "To check version: sudo asterisk -rx 'core show version'"
