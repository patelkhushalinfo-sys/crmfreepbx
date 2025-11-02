#!/bin/bash
# FreePBX Installation Script for Ubuntu 22.04/24.04
# This installs FreePBX which includes Asterisk

echo "=== FreePBX Installation (Includes Asterisk) ==="
echo ""
echo "This will install FreePBX with Asterisk pre-configured."
echo "Installation may take 30-60 minutes."
echo ""

# Check Ubuntu version
. /etc/os-release
if [[ "$VERSION_ID" != "22.04" && "$VERSION_ID" != "24.04" ]]; then
    echo "Warning: This script is tested on Ubuntu 22.04/24.04"
    read -p "Continue anyway? (y/n): " continue
    if [ "$continue" != "y" ]; then
        exit 1
    fi
fi

# Update system
echo "Updating system..."
sudo apt update && sudo apt upgrade -y

# Download FreePBX installer
echo "Downloading FreePBX installer..."
cd /usr/src
sudo wget -O sng_freepbx_debian_install.sh \
  https://github.com/FreePBX/sng_freepbx_debian_install/raw/master/sng_freepbx_debian_install.sh

# Make executable
sudo chmod +x sng_freepbx_debian_install.sh

# Run installer
echo ""
echo "Starting FreePBX installation..."
echo "This will install:"
echo "  - Asterisk (compatible version)"
echo "  - FreePBX web GUI"
echo "  - MariaDB database"
echo "  - Apache web server"
echo ""
sudo ./sng_freepbx_debian_install.sh

# Wait for completion
echo ""
echo "Installation process started."
echo "Please wait for completion (30-60 minutes)..."
echo ""
echo "After installation:"
echo "1. Access FreePBX: http://$(hostname -I | awk '{print $1}')"
echo "2. Complete web setup wizard"
echo "3. Create admin account"
echo ""

# Note about AMI configuration
cat << 'EOF'

=== Post-Installation Steps ===

1. Access FreePBX Web Interface:
   http://YOUR_SERVER_IP
   
2. Complete Setup Wizard:
   - Create admin username/password
   - Set notification email
   - Apply changes

3. Configure AMI for CallBot:
   - SSH to server
   - Edit: sudo nano /etc/asterisk/manager.conf
   
   Add this configuration:
   
   [callbot_user]
   secret = your_secure_password
   read = all
   write = all
   
   - Reload: sudo asterisk -rx "manager reload"

4. Create SIP Trunk:
   - In FreePBX GUI: Connectivity > Trunks
   - Add new trunk
   - Configure your VoIP provider details
   - Note the trunk name for CallBot .env file

5. Create Outbound Route:
   - In FreePBX GUI: Connectivity > Outbound Routes
   - Add route for your campaigns
   - Link to your trunk

6. Add Custom Dialplan:
   - SSH to server
   - Edit: sudo nano /etc/asterisk/extensions_custom.conf
   
   Add the outbound_campaign context from:
   /opt/callbot/asterisk_config_sample.conf
   
   - Apply config: sudo asterisk -rx "dialplan reload"

7. Test Configuration:
   - In FreePBX GUI: Reports > Asterisk Info
   - Check system status
   - Verify trunk registration

EOF

echo ""
echo "Installation script complete!"
echo "Follow the post-installation steps above."
