#!/bin/bash
# Supervisor Installation Script

echo "=== Installing Supervisor ==="

# Update system
sudo apt update

# Install Supervisor
sudo apt install -y supervisor

# Enable and start Supervisor
sudo systemctl enable supervisor
sudo systemctl start supervisor

# Check status
echo ""
echo "=== Supervisor Installation Complete ==="
sudo systemctl status supervisor --no-pager

echo ""
echo "Supervisor is installed at: /etc/supervisor/"
echo "Config directory: /etc/supervisor/conf.d/"
echo ""
echo "Commands:"
echo "  sudo supervisorctl status        - View all services"
echo "  sudo supervisorctl restart all   - Restart all services"
echo "  sudo supervisorctl reread        - Reload configs"
echo "  sudo supervisorctl update        - Apply config changes"
