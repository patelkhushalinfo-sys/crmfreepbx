# 🎯 Complete FreePBX Installation Guide
## Step-by-Step Guide to Install FreePBX with GUI (Includes Asterisk)

---

## 📋 Prerequisites

### Server Requirements:
- **OS**: Ubuntu 22.04 LTS or Ubuntu 24.04 LTS (Fresh installation recommended)
- **RAM**: Minimum 4GB (8GB recommended)
- **CPU**: 2+ cores
- **Storage**: 20GB+ free space
- **Network**: Static IP address recommended
- **Access**: Root or sudo privileges

---

## 🚀 Step-by-Step Installation

### Step 1: Prepare Your Server

SSH into your server and update the system:

```bash
# SSH to your server
ssh your-user@your-server-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Reboot if kernel was updated
sudo reboot
```

Wait 2-3 minutes, then SSH back in.

---

### Step 2: Download FreePBX Installer

```bash
# Go to source directory
cd /usr/src

# Download the official FreePBX installer
sudo wget -O sng_freepbx_debian_install.sh \
  https://github.com/FreePBX/sng_freepbx_debian_install/raw/master/sng_freepbx_debian_install.sh

# Make it executable
sudo chmod +x sng_freepbx_debian_install.sh

# View the script (optional)
less sng_freepbx_debian_install.sh
```

---

### Step 3: Run FreePBX Installation

**⚠️ Important: This will take 30-60 minutes. Don't interrupt!**

```bash
# Start installation
sudo ./sng_freepbx_debian_install.sh
```

**What it installs:**
- ✅ Asterisk 20 (compatible version)
- ✅ FreePBX web interface
- ✅ MariaDB database
- ✅ Apache web server
- ✅ PHP and required modules
- ✅ All dependencies

**During installation:**
- You may see prompts - press ENTER to accept defaults
- Installation will download, compile, and configure everything
- **Be patient** - compilation takes time
- Keep your terminal open

---

### Step 4: Check Installation Status

After installation completes:

```bash
# Check if services are running
sudo systemctl status asterisk
sudo systemctl status freepbx

# Check Asterisk version
sudo asterisk -rx "core show version"

# Check if ports are listening
sudo netstat -tlnp | grep -E '80|5038'
```

**Expected output:**
- Asterisk should be RUNNING
- Port 80 (web) should be LISTENING
- Port 5038 (AMI) should be LISTENING

---

## 🌐 Step 5: Access FreePBX Web GUI

### Find Your Server IP:
```bash
hostname -I
# Example output: 192.168.1.100
```

### Open Browser:
```
http://192.168.1.100
```

**Note:** Use HTTP (not HTTPS) for initial setup.

---

## 🔧 Step 6: Complete FreePBX Setup Wizard

### 6.1 Initial Access
When you first access FreePBX, you'll see the setup wizard.

**Screen 1: Language**
- Select your language
- Click "Next"

**Screen 2: Create Admin Account**
- Username: `admin` (or your choice)
- Password: Create a STRONG password
- Email: Your email address
- Click "Next"

**Screen 3: Notification Settings**
- Configure if you want email notifications
- Click "Next"

**Screen 4: Registration** (Optional)
- You can skip commercial module registration
- Click "Skip" or register if you want

**Screen 5: Complete**
- Click "Finish"

### 6.2 Apply Configuration
After wizard completion:
- You'll see the FreePBX dashboard
- Click the orange "Apply Config" button (top right)
- Click "Apply" to confirm

---

## 📞 Step 7: Configure SIP Trunk (For Outbound Calls)

### 7.1 Navigate to Trunks
```
Connectivity → Trunks → Add Trunk → Add SIP (chan_pjsip) Trunk
```

### 7.2 Configure Trunk Settings

**General Tab:**
- **Trunk Name**: `mytrunk` (remember this name for CallBot!)
- **Outbound CallerID**: Your caller ID number
- **CID Options**: Leave as default

**pjsip Settings Tab:**
- **Username**: Provided by your VoIP provider
- **Secret**: Password from your VoIP provider
- **SIP Server**: Your provider's SIP server (e.g., sip.provider.com)
- **SIP Server Port**: Usually 5060

**Example configuration for testing:**
```
Trunk Name: mytrunk
Username: youruser
Secret: yourpassword
SIP Server: sip.yourprovider.com
Port: 5060
Context: from-trunk
```

Click **Submit** then **Apply Config**

### 7.3 Verify Trunk Registration

```
Admin → Asterisk CLI
```

Type this command:
```
pjsip show registration
```

You should see your trunk as "Registered"

---

## 🎯 Step 8: Create Outbound Route

### 8.1 Navigate to Outbound Routes
```
Connectivity → Outbound Routes → Add Outbound Route
```

### 8.2 Configure Route

**Route Settings:**
- **Route Name**: `callbot_route`
- **Trunk Sequence**: Select your trunk (`mytrunk`)
- **Dial Patterns**: Add patterns for numbers you'll call

**Dial Pattern Examples:**
```
NXXNXXXXXX    (US 10-digit numbers)
1NXXNXXXXXX   (US with 1 prefix)
ZXXXXXXXX     (8-digit numbers)
XXXXXXXXXX    (10-digit generic)
```

Click **Submit** then **Apply Config**

---

## 🔐 Step 9: Configure AMI for CallBot

AMI (Asterisk Manager Interface) allows CallBot to control Asterisk.

### 9.1 Edit AMI Configuration

```bash
# SSH to server
sudo nano /etc/asterisk/manager.conf
```

### 9.2 Add CallBot User

Scroll to the bottom and add:

```ini
[general]
enabled = yes
port = 5038
bindaddr = 0.0.0.0

[callbot]
secret = YourStrongPassword123!
read = all
write = all
```

**Save:** Press `Ctrl+X`, then `Y`, then `Enter`

### 9.3 Reload AMI

```bash
sudo asterisk -rx "manager reload"
```

### 9.4 Verify AMI

```bash
# Test AMI connection
telnet localhost 5038
```

You should see:
```
Asterisk Call Manager/X.X
```

Press `Ctrl+]` then type `quit` to exit.

---

## 📝 Step 10: Add Custom Dialplan for CallBot

FreePBX needs custom dialplan for DTMF capture.

### 10.1 Edit Custom Extensions

```bash
sudo nano /etc/asterisk/extensions_custom.conf
```

### 10.2 Add This Configuration

Copy and paste:

```ini
; ========================================
; CallBot Outbound Campaign Context
; ========================================
[outbound_campaign]

exten => _X.,1,NoOp(*** CallBot Outbound Campaign ***)
    same => n,Set(CAMPAIGN_ID=${CALLERID(num)})
    same => n,Set(CONTACT_PHONE=${EXTEN})
    same => n,Answer()
    same => n,Wait(1)
    
    ; Play greeting (using built-in sound)
    same => n,Playback(hello-world)
    same => n,Playback(press-1)
    
    ; Read DTMF input (1 digit, 5 second timeout)
    same => n,Read(DTMF_RESPONSE,beep,1,,1,5)
    same => n,NoOp(Customer pressed: ${DTMF_RESPONSE})
    
    ; Send event for CallBot to capture
    same => n,Set(CALL_DURATION=$[${EPOCH} - ${ANSWEREDTIME}])
    same => n,UserEvent(CALL_RESPONSE,CampaignID:${CAMPAIGN_ID},Phone:${CONTACT_PHONE},DTMF:${DTMF_RESPONSE},Duration:${CALL_DURATION})
    
    ; Thank customer
    same => n,GotoIf($["${DTMF_RESPONSE}" = "1"]?accepted:other)
    same => n(accepted),Playback(thank-you-cooperation)
    same => n,Goto(end)
    same => n(other),Playback(goodbye)
    same => n(end),Hangup()

; Timeout handler
exten => t,1,NoOp(Timeout - No DTMF)
    same => n,Playback(goodbye)
    same => n,Hangup()
```

**Save:** `Ctrl+X`, `Y`, `Enter`

### 10.3 Reload Dialplan

```bash
sudo asterisk -rx "dialplan reload"
```

### 10.4 Verify Dialplan

```bash
sudo asterisk -rx "dialplan show outbound_campaign"
```

You should see your dialplan configuration.

---

## 🎨 Step 11: Optional - Add Custom Audio Files

If you want custom greetings instead of "hello-world":

### 11.1 Record Your Message
- Use Audacity or any audio editor
- Format: WAV, 8000Hz, 16-bit, Mono

### 11.2 Convert to Proper Format

```bash
# Install sox if needed
sudo apt install -y sox

# Convert your file
sox your_greeting.wav -r 8000 -c 1 -e signed-integer greeting.wav
```

### 11.3 Upload to FreePBX

**Option A: Via Web GUI**
```
Admin → Sound Files → Upload → Choose File → Submit
```

**Option B: Via SSH**
```bash
sudo cp greeting.wav /var/lib/asterisk/sounds/custom/
sudo chown asterisk:asterisk /var/lib/asterisk/sounds/custom/greeting.wav
```

### 11.4 Update Dialplan

Edit `/etc/asterisk/extensions_custom.conf`:
```bash
sudo nano /etc/asterisk/extensions_custom.conf
```

Change this line:
```ini
same => n,Playback(hello-world)
```

To:
```ini
same => n,Playback(custom/greeting)
```

Reload:
```bash
sudo asterisk -rx "dialplan reload"
```

---

## ⚙️ Step 12: Configure CallBot Application

Now configure your CallBot to use FreePBX.

### 12.1 Update Backend .env

```bash
cd /opt/callbot/backend
nano .env
```

**Update these values:**
```bash
# Asterisk AMI Configuration
ASTERISK_HOST=127.0.0.1
ASTERISK_PORT=5038
ASTERISK_USERNAME=callbot
ASTERISK_PASSWORD=YourStrongPassword123!

# SIP Configuration (use your trunk name from Step 7)
SIP_TRUNK_NAME=mytrunk
DEFAULT_CALLER_ID=1234567890
```

**Save:** `Ctrl+X`, `Y`, `Enter`

### 12.2 Restart CallBot Backend

```bash
sudo supervisorctl restart callbot-backend
```

### 12.3 Check Logs

```bash
sudo tail -f /var/log/supervisor/callbot-backend.log
```

Look for: "Mock Asterisk Manager connected" should change to real connection.

---

## ✅ Step 13: Test Everything

### 13.1 Test FreePBX Access
```
Open browser: http://your-server-ip
Login with admin credentials
```

### 13.2 Test Trunk Registration
```
In FreePBX GUI:
Connectivity → Trunks → Click your trunk
Should show "OK (registered)"
```

### 13.3 Test AMI Connection
```bash
telnet localhost 5038
# Should connect successfully
```

### 13.4 Test CallBot API
```bash
curl http://localhost:8001/api/
# Should return: {"message":"Outbound Calling Bot API","version":"1.0.0"}
```

### 13.5 Test Complete Flow

1. **Access CallBot Web Interface:**
   ```
   http://your-server-ip:3000
   ```

2. **Create a Campaign**

3. **Add Test Contact** (use YOUR phone number)

4. **Create Call Script**

5. **Start Campaign**

6. **You should receive a call!**

---

## 🔒 Step 14: Security Hardening

### 14.1 Enable Firewall

```bash
# Enable UFW
sudo ufw enable

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP (FreePBX GUI)
sudo ufw allow 80/tcp

# Allow HTTPS (if using SSL later)
sudo ufw allow 443/tcp

# Allow SIP
sudo ufw allow 5060/udp

# Allow RTP (voice traffic)
sudo ufw allow 10000:20000/udp

# Check status
sudo ufw status
```

### 14.2 Change FreePBX Admin Password

In FreePBX GUI:
```
Settings → Administrator → Click admin → New Password
```

### 14.3 Restrict AMI Access

Edit `/etc/asterisk/manager.conf`:
```bash
sudo nano /etc/asterisk/manager.conf
```

Change:
```ini
bindaddr = 127.0.0.1  # Only allow local connections
```

Reload:
```bash
sudo asterisk -rx "manager reload"
```

---

## 📊 Step 15: Monitoring & Logs

### FreePBX Logs
```bash
# Asterisk full log
sudo tail -f /var/log/asterisk/full

# Asterisk messages
sudo tail -f /var/log/asterisk/messages
```

### CallBot Logs
```bash
# Backend
sudo tail -f /var/log/supervisor/callbot-backend.log

# Frontend
sudo tail -f /var/log/supervisor/callbot-frontend.log
```

### View Active Calls
```
In FreePBX GUI: Reports → Asterisk Info → Channels
```

### Asterisk CLI
```bash
sudo asterisk -rvvv
```

**Useful CLI commands:**
```
core show channels        - Show active calls
pjsip show endpoints      - Show SIP endpoints
pjsip show registrations  - Show trunk registration
manager show connected    - Show AMI connections
dialplan show outbound_campaign - Show your dialplan
```

---

## 🆘 Troubleshooting

### Problem: Can't access FreePBX web interface

**Solution:**
```bash
# Check Apache
sudo systemctl status apache2

# Restart Apache
sudo systemctl restart apache2

# Check port 80
sudo netstat -tlnp | grep :80
```

### Problem: Trunk not registering

**Solution:**
1. Check credentials in FreePBX GUI
2. Verify with provider
3. Check firewall allows port 5060
4. View logs: `sudo tail -f /var/log/asterisk/full`

### Problem: CallBot can't connect to AMI

**Solution:**
```bash
# Check AMI config
sudo cat /etc/asterisk/manager.conf | grep -A5 callbot

# Test AMI
telnet localhost 5038

# Check credentials in CallBot .env
cat /opt/callbot/backend/.env | grep ASTERISK
```

### Problem: Calls not working

**Solution:**
1. Check trunk is registered
2. Verify outbound route exists
3. Check dialplan: `sudo asterisk -rx "dialplan show outbound_campaign"`
4. View call logs: `sudo tail -f /var/log/asterisk/full`

### Problem: DTMF not captured

**Solution:**
1. Check dialplan has Read() application
2. Verify SIP DTMF mode is rfc2833
3. Test manually via Asterisk CLI
4. Check CallBot event listener is running

---

## 📋 Quick Reference

### Important Paths
```
FreePBX GUI: http://your-server-ip
CallBot GUI: http://your-server-ip:3000
Config files: /etc/asterisk/
Custom dialplan: /etc/asterisk/extensions_custom.conf
AMI config: /etc/asterisk/manager.conf
Sounds: /var/lib/asterisk/sounds/
Logs: /var/log/asterisk/
```

### Important Commands
```bash
# Restart services
sudo systemctl restart asterisk
sudo systemctl restart freepbx
sudo supervisorctl restart callbot-backend

# Apply FreePBX changes
sudo fwconsole reload

# Asterisk CLI
sudo asterisk -rvvv

# Reload configs
sudo asterisk -rx "dialplan reload"
sudo asterisk -rx "manager reload"
sudo asterisk -rx "module reload"
```

### Default Credentials
```
FreePBX GUI:
  Username: admin
  Password: (the one you set during setup)

AMI:
  Username: callbot
  Password: (from manager.conf)
```

---

## 🎉 You're Done!

Your FreePBX installation is complete with:
- ✅ FreePBX web GUI
- ✅ Asterisk (compatible version)
- ✅ SIP trunk configured
- ✅ Outbound route set up
- ✅ AMI enabled for CallBot
- ✅ Custom dialplan for DTMF capture
- ✅ CallBot connected and ready

**Access your system:**
- FreePBX: `http://your-server-ip`
- CallBot: `http://your-server-ip:3000`

---

## 📚 Additional Resources

- FreePBX Wiki: https://wiki.freepbx.org
- Asterisk Documentation: https://docs.asterisk.org
- FreePBX Forums: https://community.freepbx.org
- Your CallBot docs: `/opt/callbot/README_CALLBOT.md`

**Need help? Check logs first, then consult the documentation!**
