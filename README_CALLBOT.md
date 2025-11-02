# Outbound Calling Bot - Setup Guide

## Overview
This is a complete outbound calling bot system built with FastAPI (Python) backend and React frontend. It integrates with Asterisk/FreePBX to make automated calls and capture DTMF (button press) responses from customers.

## Features
✅ **Campaign Management** - Create and manage multiple calling campaigns
✅ **CSV Upload** - Bulk upload contacts via CSV file
✅ **Call Scripts** - Configure custom call scripts with dynamic variables
✅ **Outbound Calling** - Automated outbound calling via Asterisk/FreePBX
✅ **DTMF Capture** - Capture and store customer button press responses (1, 2, etc.)
✅ **Real-time Monitoring** - View call status and responses in real-time
✅ **Statistics Dashboard** - Track campaign performance and response rates
✅ **Start/Stop Campaigns** - Control campaign execution

## Architecture

### Backend (FastAPI + SQLite/MySQL)
- **Framework**: FastAPI with SQLAlchemy ORM
- **Database**: SQLite (development) or MySQL (production)
- **Asterisk Integration**: AMI (Asterisk Manager Interface) for call control
- **API Endpoints**: RESTful API for all operations

### Frontend (React)
- **Framework**: React with React Router
- **UI Components**: Shadcn/UI components
- **Styling**: Tailwind CSS
- **Features**: Dashboard, Campaign Management, Contact Upload, Call Monitoring

## Configuration

### Backend Environment Variables (.env)
```bash
# MySQL Configuration (optional - defaults to SQLite)
USE_MYSQL=false  # Set to 'true' to use MySQL instead of SQLite
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_mysql_password
MYSQL_DATABASE=callbot_db

# Asterisk AMI Configuration
ASTERISK_HOST=192.168.1.100  # Replace with your Asterisk server IP
ASTERISK_PORT=5038
ASTERISK_USERNAME=admin  # Replace with your AMI username
ASTERISK_PASSWORD=asterisk_secret  # Replace with your AMI password

# SIP Configuration
SIP_TRUNK_NAME=sample_trunk  # Replace with your actual SIP trunk name
DEFAULT_CALLER_ID=1234567890  # Replace with your caller ID number

# CORS
CORS_ORIGINS=*
```

### Sample Credentials (Currently Configured)
The application is currently configured with **sample credentials** for development:
- Asterisk Host: `192.168.1.100`
- AMI Username: `admin`
- AMI Password: `asterisk_secret`
- SIP Trunk: `sample_trunk`
- Caller ID: `1234567890`

**⚠️ Important**: Replace these with your actual Asterisk/FreePBX credentials before deployment!

## Asterisk/FreePBX Setup

### 1. Enable AMI (Asterisk Manager Interface)
Edit `/etc/asterisk/manager.conf`:
```ini
[general]
enabled = yes
port = 5038
bindaddr = 0.0.0.0

[admin]
secret = asterisk_secret
read = all
write = all
```

Reload Asterisk: `asterisk -x "manager reload"`

### 2. Configure Dialplan for DTMF Capture
Edit `/etc/asterisk/extensions.conf`:
```ini
[outbound_campaign]
exten => _X.,1,NoOp(*** Outbound Campaign Call ***)
same => n,Set(CAMPAIGN_ID=${CALLERID(num)})
same => n,Answer()
same => n,Wait(1)
same => n,Playback(hello-world)  ; Replace with your custom greeting
same => n,Read(DTMF_RESPONSE,beep,1,,1,5)  ; Read 1 digit, 5 sec timeout
same => n,NoOp(Customer pressed: ${DTMF_RESPONSE})
same => n,UserEvent(CALL_RESPONSE,CampaignID:${CAMPAIGN_ID},DTMF:${DTMF_RESPONSE})
same => n,Hangup()
```

Reload dialplan: `asterisk -x "dialplan reload"`

### 3. Configure SIP Trunk
Set up a SIP trunk in FreePBX or configure manually in `/etc/asterisk/sip.conf` or `/etc/asterisk/pjsip.conf`

## CSV Upload Format

To upload contacts, create a CSV file with the following columns:
```csv
phone_number,first_name,last_name,custom_data
5551234567,John,Doe,Priority Customer
5559876543,Jane,Smith,VIP
5555555555,Bob,Johnson,Regular
```

**Required column**: `phone_number`
**Optional columns**: `first_name`, `last_name`, `custom_data`

## API Documentation

### Campaigns
- `POST /api/campaigns` - Create a new campaign
- `GET /api/campaigns` - List all campaigns
- `GET /api/campaigns/{id}` - Get campaign details
- `PATCH /api/campaigns/{id}` - Update campaign
- `DELETE /api/campaigns/{id}` - Delete campaign

### Contacts
- `POST /api/campaigns/{id}/contacts` - Add single contact
- `POST /api/campaigns/{id}/contacts/bulk` - Bulk upload via CSV
- `GET /api/campaigns/{id}/contacts` - List all contacts

### Call Scripts
- `POST /api/campaigns/{id}/scripts` - Create call script
- `GET /api/campaigns/{id}/scripts` - List scripts

### Call Management
- `POST /api/campaigns/{id}/calls/initiate` - Initiate single call
- `POST /api/campaigns/{id}/calls/start-campaign` - Start campaign (call all contacts)
- `POST /api/campaigns/{id}/calls/stop` - Stop campaign
- `GET /api/campaigns/{id}/calls` - Get call records

### Statistics
- `GET /api/campaigns/{id}/stats` - Campaign statistics
- `GET /api/dashboard/stats` - Dashboard overview

## Call Script Variables

Use these placeholders in your call scripts:
- `{name}` - Customer's first name (future enhancement)
- `{phone}` - Customer's phone number (future enhancement)

Example:
```
Hello {name}, This is a general call to proceed press 1 otherwise press 2 to decline call
```

## Database Schema

### Campaigns
- id, name, description, status, trunk_name, caller_id, created_at, updated_at

### Contacts
- id, campaign_id, phone_number, first_name, last_name, custom_data, created_at

### Call Records
- id, campaign_id, contact_id, phone_number, call_time, duration, dtmf_response, call_status, notes

### Call Scripts
- id, campaign_id, script_name, script_text, created_at

## Mock Mode

The application currently runs in **mock mode** for development without requiring a real Asterisk server. The mock mode:
- Simulates call origination
- Randomly generates DTMF responses (50% response rate)
- Returns success status for all calls

To enable real Asterisk integration:
1. Update credentials in `/app/backend/.env`
2. Replace `MockAsteriskManager` with real AMI client in `server.py`
3. Install `asterisk-ami` Python package: `pip install asterisk-ami`

## Running the Application

### Backend
```bash
cd /app/backend
pip install -r requirements.txt
# Backend runs automatically via supervisor on port 8001
```

### Frontend
```bash
cd /app/frontend
yarn install
# Frontend runs automatically via supervisor on port 3000
```

Access the application at: `https://your-domain.preview.emergentagent.com`

## Production Deployment

### Switching to MySQL
1. Install MySQL and create database:
```bash
mysql -u root -p
CREATE DATABASE callbot_db;
```

2. Update `/app/backend/.env`:
```bash
USE_MYSQL=true
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=callbot_db
```

3. Restart backend: `sudo supervisorctl restart backend`

### Connecting to Real Asterisk
1. Configure Asterisk AMI (see setup section above)
2. Update credentials in `.env`
3. Replace mock manager with real implementation
4. Set up proper dialplan for DTMF capture
5. Configure SIP trunk with your VoIP provider

## Troubleshooting

### Backend not starting
Check logs: `tail -f /var/log/supervisor/backend.err.log`

### Database connection errors
- For SQLite: Ensure write permissions in `/app/backend/`
- For MySQL: Verify MySQL service is running and credentials are correct

### Asterisk connection issues
- Verify AMI is enabled: `asterisk -rx "manager show connected"`
- Check firewall allows port 5038
- Test AMI connection: `telnet asterisk_host 5038`

### DTMF not captured
- Verify dialplan configuration in extensions.conf
- Check SIP trunk DTMF mode (should be rfc2833)
- Monitor Asterisk console: `asterisk -rvvvv`

## Security Considerations

⚠️ **Production Security Checklist**:
- [ ] Change all default passwords
- [ ] Use strong AMI credentials
- [ ] Restrict AMI access to specific IPs
- [ ] Enable HTTPS for web interface
- [ ] Use environment variables for secrets
- [ ] Implement API authentication
- [ ] Set up firewall rules
- [ ] Regular security updates

## Support

For issues or questions:
1. Check application logs
2. Review Asterisk CLI output
3. Verify network connectivity
4. Test with simple dialplan first
5. Contact system administrator

## License

This application is provided as-is for development and testing purposes.
