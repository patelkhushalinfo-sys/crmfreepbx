# 🎯 START HERE - FreePBX + CallBot Installation

## Welcome! This is your starting point for deploying the Outbound Calling Bot.

---

## 📦 What You Have

This repository contains a complete **Outbound Calling Bot** system with:
- ✅ FastAPI backend (Python)
- ✅ React frontend with beautiful UI
- ✅ FreePBX integration for telephony
- ✅ DTMF response capture
- ✅ Campaign management
- ✅ CSV contact upload
- ✅ Real-time call monitoring

---

## 🚀 Installation Options

### ⭐ **RECOMMENDED: FreePBX with GUI**

**Best for**: Easy setup, web-based management, production use

**What you get**:
- FreePBX web interface for easy configuration
- Asterisk (automatically installed and compatible)
- Point-and-click trunk/route configuration
- Built-in monitoring and call logs

**Follow this guide**:
📘 **`FREEPBX_COMPLETE_GUIDE.md`** - Complete step-by-step instructions

**Quick checklist**:
📋 **`FREEPBX_CHECKLIST.md`** - Printable checklist to track progress

**Installation command**:
```bash
cd /opt/callbot
chmod +x INSTALL_FREEPBX.sh
./INSTALL_FREEPBX.sh
```

⏱️ **Time**: 2-3 hours (including compilation)

---

### Alternative: Standalone Asterisk (Advanced Users Only)

**Best for**: Minimal setup, command-line experts, lightweight deployment

**Follow this guide**:
📘 **`DEPLOYMENT_GUIDE.md`**

**Installation command**:
```bash
chmod +x INSTALL_ASTERISK.sh
./INSTALL_ASTERISK.sh
```

⏱️ **Time**: 1-2 hours

---

## 📚 Documentation Files Included

| File | Purpose |
|------|---------|
| **START_HERE.md** | 👈 You are here! Starting point |
| **FREEPBX_COMPLETE_GUIDE.md** | Complete FreePBX installation guide (RECOMMENDED) |
| **FREEPBX_CHECKLIST.md** | Printable checklist for installation |
| **DEPLOYMENT_GUIDE.md** | Alternative standalone Asterisk guide |
| **QUICKSTART.md** | Quick reference for deployment |
| **README_CALLBOT.md** | Application documentation |
| **asterisk_config_sample.conf** | Asterisk dialplan examples |

---

## 🎯 Quick Start (3 Steps)

### Step 1: Clone to Your Server
```bash
ssh your-user@your-server-ip
git clone YOUR_GITHUB_REPO /opt/callbot
cd /opt/callbot
```

### Step 2: Install FreePBX
```bash
chmod +x INSTALL_FREEPBX.sh
./INSTALL_FREEPBX.sh
```

### Step 3: Follow the Guide
Open **`FREEPBX_COMPLETE_GUIDE.md`** and follow steps 5-15

---

## 📋 Prerequisites

Before starting, ensure you have:

✅ **Server Requirements**:
- Ubuntu 22.04 or 24.04 LTS
- 4GB+ RAM (8GB recommended)
- 2+ CPU cores
- 20GB+ free storage
- Static IP address (recommended)

✅ **Access Requirements**:
- SSH access with sudo privileges
- Root access (or sudo)

✅ **External Services** (for making real calls):
- VoIP provider account (SIP trunk)
- SIP credentials (username, password, server)
- Caller ID number

---

## 🎬 Installation Flow

```
1. Install FreePBX (includes Asterisk)
   ↓
2. Access web GUI and complete setup wizard
   ↓
3. Configure SIP trunk via GUI
   ↓
4. Enable AMI for CallBot
   ↓
5. Add custom dialplan for DTMF
   ↓
6. Deploy CallBot application
   ↓
7. Configure .env files
   ↓
8. Start services
   ↓
9. Test and verify
   ↓
10. Start making calls! 🎉
```

---

## 🔍 What Gets Installed

### On Your Server:
```
/opt/callbot/               # Your application
├── backend/                # FastAPI server
│   └── .env               # Configuration (you'll create)
├── frontend/               # React app
│   └── .env               # Configuration (you'll create)
└── docs/                   # All guides

/etc/asterisk/              # Asterisk configs
├── manager.conf           # AMI configuration
├── extensions_custom.conf # Your dialplan
└── pjsip.conf            # SIP settings

/etc/supervisor/conf.d/     # Service configs
├── callbot-backend.conf
└── callbot-frontend.conf
```

### URLs After Installation:
- **FreePBX GUI**: `http://your-server-ip`
- **CallBot App**: `http://your-server-ip:3000`
- **Backend API**: `http://your-server-ip:8001/api/`

---

## 🆘 Need Help?

### Common Questions:

**Q: Which installation method should I choose?**
A: Use FreePBX (recommended). It's easier and provides a web GUI.

**Q: Do I need FreePBX AND Asterisk?**
A: No! FreePBX includes Asterisk. Choose ONE method only.

**Q: I don't have a VoIP provider yet**
A: You can still install and test locally. Get a provider before making real calls.

**Q: Can I use this for production?**
A: Yes! Follow the security hardening steps in the guides.

**Q: How long does installation take?**
A: 2-3 hours including FreePBX compilation (mostly automated).

### If Something Goes Wrong:

1. **Check the logs**:
   ```bash
   sudo tail -f /var/log/supervisor/callbot-backend.log
   sudo tail -f /var/log/asterisk/full
   ```

2. **Verify services**:
   ```bash
   sudo systemctl status asterisk
   sudo systemctl status freepbx
   sudo supervisorctl status
   ```

3. **Consult troubleshooting sections** in the guides

4. **Check configurations**:
   - `/opt/callbot/backend/.env`
   - `/opt/callbot/frontend/.env`
   - `/etc/asterisk/manager.conf`

---

## 🎯 Success Checklist

After installation, you should be able to:

- ✅ Access FreePBX web GUI
- ✅ See your SIP trunk registered
- ✅ Access CallBot web interface
- ✅ Create a campaign
- ✅ Upload contacts via CSV
- ✅ Create call scripts
- ✅ Start a campaign and make test calls
- ✅ Receive calls and press buttons
- ✅ See DTMF responses captured in CallBot

---

## 🚀 Ready to Start?

### Next Steps:

1. **Read**: `FREEPBX_COMPLETE_GUIDE.md` (10 minutes)
2. **Prepare**: Ensure server meets requirements
3. **Install**: Follow the guide step-by-step
4. **Test**: Make your first test call
5. **Deploy**: Start your campaigns!

---

## 📖 Additional Resources

- **FreePBX Wiki**: https://wiki.freepbx.org
- **Asterisk Docs**: https://docs.asterisk.org
- **FreePBX Forums**: https://community.freepbx.org

---

## 💡 Pro Tips

- ✅ Use a fresh Ubuntu installation
- ✅ Take snapshots before major changes
- ✅ Keep credentials in a secure password manager
- ✅ Test with your own phone number first
- ✅ Review logs regularly
- ✅ Keep system updated: `sudo apt update && sudo apt upgrade`

---

## 🎉 Let's Get Started!

**Open this file next**: 📘 `FREEPBX_COMPLETE_GUIDE.md`

**Or use the checklist**: 📋 `FREEPBX_CHECKLIST.md`

---

**Questions? Check the documentation files or troubleshooting sections!**

Good luck with your deployment! 🚀
