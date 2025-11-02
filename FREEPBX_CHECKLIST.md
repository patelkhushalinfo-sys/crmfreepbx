# ✅ FreePBX Installation Checklist
## Quick Reference Guide

Use this checklist while following `FREEPBX_COMPLETE_GUIDE.md`

---

## 📝 Pre-Installation

- [ ] Fresh Ubuntu 22.04 or 24.04 server
- [ ] Minimum 4GB RAM, 2 CPU cores, 20GB storage
- [ ] Root/sudo access
- [ ] Static IP (recommended)
- [ ] Server updated: `sudo apt update && sudo apt upgrade -y`

---

## 🚀 Installation Steps

### Phase 1: Install FreePBX (30-60 minutes)

- [ ] SSH to server: `ssh user@server-ip`
- [ ] Download installer:
  ```bash
  cd /usr/src
  sudo wget -O sng_freepbx_debian_install.sh \
    https://github.com/FreePBX/sng_freepbx_debian_install/raw/master/sng_freepbx_debian_install.sh
  sudo chmod +x sng_freepbx_debian_install.sh
  ```
- [ ] Run installer: `sudo ./sng_freepbx_debian_install.sh`
- [ ] Wait for completion (DON'T INTERRUPT!)
- [ ] Verify services running:
  ```bash
  sudo systemctl status asterisk
  sudo systemctl status freepbx
  ```

### Phase 2: Web Setup (10 minutes)

- [ ] Find server IP: `hostname -I`
- [ ] Open browser: `http://your-server-ip`
- [ ] Complete setup wizard:
  - [ ] Set admin username
  - [ ] Set STRONG password (save it!)
  - [ ] Set email address
  - [ ] Skip registration (optional)
- [ ] Click "Apply Config" (orange button)

### Phase 3: Configure SIP Trunk (15 minutes)

- [ ] In FreePBX: `Connectivity → Trunks → Add SIP Trunk`
- [ ] Set trunk name: `mytrunk` (remember this!)
- [ ] Enter provider details:
  - [ ] Username: `_____________`
  - [ ] Secret/Password: `_____________`
  - [ ] SIP Server: `_____________`
  - [ ] Port: `5060`
- [ ] Click Submit → Apply Config
- [ ] Verify registration: `Admin → Asterisk CLI`
  ```
  pjsip show registrations
  ```
- [ ] Should show "Registered"

### Phase 4: Create Outbound Route (5 minutes)

- [ ] `Connectivity → Outbound Routes → Add Route`
- [ ] Route name: `callbot_route`
- [ ] Select trunk: `mytrunk`
- [ ] Add dial patterns (examples):
  - [ ] `NXXNXXXXXX` (US 10-digit)
  - [ ] `XXXXXXXXXX` (generic 10-digit)
- [ ] Click Submit → Apply Config

### Phase 5: Configure AMI (10 minutes)

- [ ] SSH to server
- [ ] Edit AMI config:
  ```bash
  sudo nano /etc/asterisk/manager.conf
  ```
- [ ] Add at bottom:
  ```ini
  [callbot]
  secret = YourStrongPassword123!
  read = all
  write = all
  ```
- [ ] Save (Ctrl+X, Y, Enter)
- [ ] Reload: `sudo asterisk -rx "manager reload"`
- [ ] Test: `telnet localhost 5038` (should connect)

### Phase 6: Add Custom Dialplan (10 minutes)

- [ ] Edit custom extensions:
  ```bash
  sudo nano /etc/asterisk/extensions_custom.conf
  ```
- [ ] Copy dialplan from `FREEPBX_COMPLETE_GUIDE.md` Step 10.2
- [ ] Paste into file
- [ ] Save (Ctrl+X, Y, Enter)
- [ ] Reload: `sudo asterisk -rx "dialplan reload"`
- [ ] Verify: `sudo asterisk -rx "dialplan show outbound_campaign"`

### Phase 7: Configure CallBot (5 minutes)

- [ ] Clone repository:
  ```bash
  sudo mkdir -p /opt/callbot
  sudo chown $USER:$USER /opt/callbot
  git clone YOUR_GITHUB_REPO /opt/callbot
  ```
- [ ] Setup backend:
  ```bash
  cd /opt/callbot/backend
  cp .env.example .env
  nano .env
  ```
- [ ] Update values in .env:
  - [ ] `ASTERISK_HOST=127.0.0.1`
  - [ ] `ASTERISK_PORT=5038`
  - [ ] `ASTERISK_USERNAME=callbot`
  - [ ] `ASTERISK_PASSWORD=YourStrongPassword123!`
  - [ ] `SIP_TRUNK_NAME=mytrunk`
  - [ ] `DEFAULT_CALLER_ID=your_number`
- [ ] Save (Ctrl+X, Y, Enter)

### Phase 8: Install CallBot Dependencies (10 minutes)

- [ ] Backend setup:
  ```bash
  cd /opt/callbot/backend
  python3.11 -m venv venv
  source venv/bin/activate
  pip install -r requirements.txt
  deactivate
  ```
- [ ] Frontend setup:
  ```bash
  cd /opt/callbot/frontend
  cp .env.example .env
  nano .env
  ```
- [ ] Set: `REACT_APP_BACKEND_URL=http://your-server-ip:8001`
- [ ] Save and install:
  ```bash
  yarn install
  ```

### Phase 9: Configure Supervisor (5 minutes)

- [ ] Create backend service:
  ```bash
  sudo nano /etc/supervisor/conf.d/callbot-backend.conf
  ```
- [ ] Paste config from `FREEPBX_COMPLETE_GUIDE.md` or use:
  ```ini
  [program:callbot-backend]
  directory=/opt/callbot/backend
  command=/opt/callbot/backend/venv/bin/python -m uvicorn server:app --host 0.0.0.0 --port 8001
  user=YOUR_USERNAME
  autostart=true
  autorestart=true
  stdout_logfile=/var/log/supervisor/callbot-backend.log
  stderr_logfile=/var/log/supervisor/callbot-backend-error.log
  ```
- [ ] Create frontend service:
  ```bash
  sudo nano /etc/supervisor/conf.d/callbot-frontend.conf
  ```
  ```ini
  [program:callbot-frontend]
  directory=/opt/callbot/frontend
  command=/usr/bin/yarn start
  user=YOUR_USERNAME
  autostart=true
  autorestart=true
  stdout_logfile=/var/log/supervisor/callbot-frontend.log
  environment=PORT="3000"
  ```
- [ ] Reload supervisor:
  ```bash
  sudo supervisorctl reread
  sudo supervisorctl update
  sudo supervisorctl start all
  ```

### Phase 10: Configure Firewall (5 minutes)

- [ ] Enable firewall:
  ```bash
  sudo ufw enable
  sudo ufw allow 22/tcp
  sudo ufw allow 80/tcp
  sudo ufw allow 443/tcp
  sudo ufw allow 5060/udp
  sudo ufw allow 10000:20000/udp
  sudo ufw status
  ```

---

## ✅ Testing Checklist

### Verify FreePBX

- [ ] Access FreePBX GUI: `http://your-server-ip`
- [ ] Login successful
- [ ] Check trunk: `Connectivity → Trunks` (should show OK)
- [ ] Check routes: `Connectivity → Outbound Routes` (should show your route)

### Verify Asterisk

- [ ] SSH to server
- [ ] Access CLI: `sudo asterisk -rvvv`
- [ ] Check version: `core show version`
- [ ] Check trunk: `pjsip show registrations`
- [ ] Check AMI: `manager show connected`
- [ ] Check dialplan: `dialplan show outbound_campaign`
- [ ] Exit: `exit`

### Verify CallBot

- [ ] Check backend API:
  ```bash
  curl http://localhost:8001/api/
  ```
- [ ] Should return: `{"message":"Outbound Calling Bot API","version":"1.0.0"}`
- [ ] Check services:
  ```bash
  sudo supervisorctl status
  ```
- [ ] Both should show RUNNING
- [ ] Check logs:
  ```bash
  sudo tail -f /var/log/supervisor/callbot-backend.log
  ```
- [ ] Should NOT show errors

### Test Complete Flow

- [ ] Open CallBot: `http://your-server-ip:3000`
- [ ] Create new campaign
- [ ] Add your phone number as contact
- [ ] Create call script
- [ ] Start campaign
- [ ] Receive test call on your phone
- [ ] Press button during call
- [ ] Verify DTMF captured in CallBot interface

---

## 📊 Post-Installation

### Save Your Credentials

Record these securely:

```
FreePBX Admin:
  URL: http://_______________
  Username: _______________
  Password: _______________

AMI:
  Username: callbot
  Password: _______________

SIP Trunk:
  Name: _______________
  Provider: _______________
  Username: _______________

Server:
  IP Address: _______________
  SSH User: _______________
```

### Backup Configuration

- [ ] Backup FreePBX: `Admin → Backup & Restore`
- [ ] Backup CallBot database:
  ```bash
  cp /opt/callbot/backend/callbot.db ~/callbot_backup_$(date +%Y%m%d).db
  ```

### Security Hardening

- [ ] Change default FreePBX password
- [ ] Restrict AMI to localhost only
- [ ] Enable fail2ban (optional):
  ```bash
  sudo apt install fail2ban
  ```
- [ ] Keep system updated:
  ```bash
  sudo apt update && sudo apt upgrade
  ```

---

## 🆘 If Something Goes Wrong

### FreePBX not accessible
```bash
sudo systemctl restart apache2
sudo systemctl restart freepbx
```

### Asterisk not running
```bash
sudo systemctl restart asterisk
sudo systemctl status asterisk
```

### CallBot not working
```bash
sudo supervisorctl restart all
sudo tail -f /var/log/supervisor/callbot-backend-error.log
```

### Trunk not registering
- Check credentials in FreePBX GUI
- Check firewall allows port 5060
- Contact your VoIP provider

### Can't make calls
- Verify trunk is registered
- Check outbound route exists
- Verify dialplan: `sudo asterisk -rx "dialplan show outbound_campaign"`

---

## 📚 Documentation Reference

- **Complete Guide**: `FREEPBX_COMPLETE_GUIDE.md`
- **CallBot Documentation**: `README_CALLBOT.md`
- **Deployment Guide**: `DEPLOYMENT_GUIDE.md`
- **Quick Start**: `QUICKSTART.md`

---

## ✨ Installation Complete!

Once all checkboxes are checked, you have:
- ✅ FreePBX with web GUI running
- ✅ Asterisk configured and registered
- ✅ SIP trunk connected
- ✅ CallBot application deployed
- ✅ Everything tested and working

**Start making calls!** 🎉

Access your systems:
- **FreePBX**: `http://your-server-ip`
- **CallBot**: `http://your-server-ip:3000`

---

**Estimated Total Time**: 2-3 hours (including Asterisk compilation)

**Next Steps**: Start creating campaigns and making calls!
