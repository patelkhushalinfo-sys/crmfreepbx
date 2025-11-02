from fastapi import FastAPI, APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from fastapi.responses import JSONResponse, StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Boolean, Text, Enum as SQLEnum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
import enum
import csv
from io import StringIO
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MySQL connection
mysql_user = os.getenv('MYSQL_USER', 'root')
mysql_password = os.getenv('MYSQL_PASSWORD', 'mysql_pass')
mysql_host = os.getenv('MYSQL_HOST', 'localhost')
mysql_port = os.getenv('MYSQL_PORT', '3306')
mysql_db = os.getenv('MYSQL_DATABASE', 'callbot_db')

DATABASE_URL = f"mysql+pymysql://{mysql_user}:{mysql_password}@{mysql_host}:{mysql_port}/{mysql_db}"

# SQLAlchemy setup
Base = declarative_base()
engine = create_engine(DATABASE_URL, echo=False, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Enums
class CallStatus(str, enum.Enum):
    PENDING = "pending"
    INITIATED = "initiated"
    RINGING = "ringing"
    ANSWERED = "answered"
    COMPLETED = "completed"
    FAILED = "failed"
    NO_ANSWER = "no_answer"
    BUSY = "busy"

class CampaignStatus(str, enum.Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"

# Database Models
class Campaign(Base):
    __tablename__ = "campaigns"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    status = Column(SQLEnum(CampaignStatus), default=CampaignStatus.DRAFT)
    trunk_name = Column(String(100), nullable=False)
    caller_id = Column(String(20), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

class CallScript(Base):
    __tablename__ = "call_scripts"
    
    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, nullable=False, index=True)
    script_name = Column(String(255), nullable=False)
    script_text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class Contact(Base):
    __tablename__ = "contacts"
    
    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, nullable=False, index=True)
    phone_number = Column(String(20), nullable=False)
    first_name = Column(String(100))
    last_name = Column(String(100))
    custom_data = Column(Text)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class CallRecord(Base):
    __tablename__ = "call_records"
    
    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, nullable=False, index=True)
    contact_id = Column(Integer, nullable=False, index=True)
    phone_number = Column(String(20), nullable=False)
    call_time = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    duration = Column(Integer, default=0)
    dtmf_response = Column(String(50))
    call_status = Column(SQLEnum(CallStatus), default=CallStatus.PENDING)
    recording_file = Column(String(255))
    uniqueid = Column(String(100))
    notes = Column(Text)

# Create tables
Base.metadata.create_all(bind=engine)

# Pydantic Models
class CampaignCreate(BaseModel):
    name: str
    description: Optional[str] = None
    trunk_name: str = Field(default_factory=lambda: os.getenv('SIP_TRUNK_NAME', 'sample_trunk'))
    caller_id: str = Field(default_factory=lambda: os.getenv('DEFAULT_CALLER_ID', '1234567890'))

class CampaignUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[CampaignStatus] = None
    trunk_name: Optional[str] = None
    caller_id: Optional[str] = None

class CampaignResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    status: CampaignStatus
    trunk_name: str
    caller_id: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class CallScriptCreate(BaseModel):
    script_name: str
    script_text: str

class CallScriptResponse(BaseModel):
    id: int
    campaign_id: int
    script_name: str
    script_text: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class ContactCreate(BaseModel):
    phone_number: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    custom_data: Optional[str] = None

class ContactResponse(BaseModel):
    id: int
    campaign_id: int
    phone_number: str
    first_name: Optional[str]
    last_name: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

class CallRecordResponse(BaseModel):
    id: int
    campaign_id: int
    contact_id: int
    phone_number: str
    call_time: datetime
    duration: int
    dtmf_response: Optional[str]
    call_status: CallStatus
    notes: Optional[str]
    
    class Config:
        from_attributes = True

class CallInitiate(BaseModel):
    contact_id: int

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Create the main app
app = FastAPI(title="Outbound Calling Bot API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Mock Asterisk Manager (for development without real Asterisk)
class MockAsteriskManager:
    def __init__(self):
        self.connected = False
    
    def connect(self):
        self.connected = True
        logging.info("Mock Asterisk Manager connected")
        return True
    
    def disconnect(self):
        self.connected = False
        logging.info("Mock Asterisk Manager disconnected")
    
    def originate_call(self, channel: str, exten: str, context: str, caller_id: str, timeout: int = 30):
        # Simulate call origination
        logging.info(f"Mock call originated to {channel}")
        return {
            'success': True,
            'action_id': f'mock_action_{datetime.now().timestamp()}',
            'message': 'Call originated successfully (mocked)'
        }

asterisk_manager = MockAsteriskManager()

# Campaign Endpoints
@api_router.post("/campaigns", response_model=CampaignResponse)
async def create_campaign(campaign: CampaignCreate, db: Session = Depends(get_db)):
    """Create a new calling campaign"""
    db_campaign = Campaign(**campaign.model_dump())
    db.add(db_campaign)
    db.commit()
    db.refresh(db_campaign)
    return db_campaign

@api_router.get("/campaigns", response_model=List[CampaignResponse])
async def list_campaigns(db: Session = Depends(get_db)):
    """List all campaigns"""
    campaigns = db.query(Campaign).order_by(Campaign.created_at.desc()).all()
    return campaigns

@api_router.get("/campaigns/{campaign_id}", response_model=CampaignResponse)
async def get_campaign(campaign_id: int, db: Session = Depends(get_db)):
    """Get a specific campaign"""
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return campaign

@api_router.patch("/campaigns/{campaign_id}", response_model=CampaignResponse)
async def update_campaign(campaign_id: int, campaign_update: CampaignUpdate, db: Session = Depends(get_db)):
    """Update a campaign"""
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    update_data = campaign_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(campaign, key, value)
    
    campaign.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(campaign)
    return campaign

@api_router.delete("/campaigns/{campaign_id}")
async def delete_campaign(campaign_id: int, db: Session = Depends(get_db)):
    """Delete a campaign"""
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    db.delete(campaign)
    db.commit()
    return {"message": "Campaign deleted successfully"}

# Call Script Endpoints
@api_router.post("/campaigns/{campaign_id}/scripts", response_model=CallScriptResponse)
async def create_call_script(campaign_id: int, script: CallScriptCreate, db: Session = Depends(get_db)):
    """Create a call script for a campaign"""
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    db_script = CallScript(campaign_id=campaign_id, **script.model_dump())
    db.add(db_script)
    db.commit()
    db.refresh(db_script)
    return db_script

@api_router.get("/campaigns/{campaign_id}/scripts", response_model=List[CallScriptResponse])
async def get_call_scripts(campaign_id: int, db: Session = Depends(get_db)):
    """Get all scripts for a campaign"""
    scripts = db.query(CallScript).filter(CallScript.campaign_id == campaign_id).all()
    return scripts

# Contact Endpoints
@api_router.post("/campaigns/{campaign_id}/contacts", response_model=ContactResponse)
async def add_contact(campaign_id: int, contact: ContactCreate, db: Session = Depends(get_db)):
    """Add a single contact to a campaign"""
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    db_contact = Contact(campaign_id=campaign_id, **contact.model_dump())
    db.add(db_contact)
    db.commit()
    db.refresh(db_contact)
    return db_contact

@api_router.post("/campaigns/{campaign_id}/contacts/bulk")
async def bulk_upload_contacts(campaign_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Bulk upload contacts via CSV file"""
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    # Read CSV file
    contents = await file.read()
    csv_content = contents.decode('utf-8')
    csv_file = StringIO(csv_content)
    reader = csv.DictReader(csv_file)
    
    contacts_added = 0
    errors = []
    
    for row_num, row in enumerate(reader, start=2):
        try:
            if 'phone_number' not in row:
                errors.append(f"Row {row_num}: Missing phone_number field")
                continue
            
            contact = Contact(
                campaign_id=campaign_id,
                phone_number=row['phone_number'],
                first_name=row.get('first_name', ''),
                last_name=row.get('last_name', ''),
                custom_data=row.get('custom_data', '')
            )
            db.add(contact)
            contacts_added += 1
        except Exception as e:
            errors.append(f"Row {row_num}: {str(e)}")
    
    db.commit()
    
    return {
        "message": "Bulk upload completed",
        "contacts_added": contacts_added,
        "errors": errors
    }

@api_router.get("/campaigns/{campaign_id}/contacts", response_model=List[ContactResponse])
async def list_contacts(campaign_id: int, db: Session = Depends(get_db)):
    """List all contacts in a campaign"""
    contacts = db.query(Contact).filter(Contact.campaign_id == campaign_id).all()
    return contacts

# Call Management Endpoints
@api_router.post("/campaigns/{campaign_id}/calls/initiate")
async def initiate_call(campaign_id: int, call_data: CallInitiate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Initiate a call to a contact"""
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    contact = db.query(Contact).filter(
        Contact.id == call_data.contact_id,
        Contact.campaign_id == campaign_id
    ).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    # Create call record
    call_record = CallRecord(
        campaign_id=campaign_id,
        contact_id=contact.id,
        phone_number=contact.phone_number,
        call_status=CallStatus.PENDING,
        uniqueid=f"{campaign_id}_{contact.id}_{int(datetime.now(timezone.utc).timestamp())}"
    )
    db.add(call_record)
    db.commit()
    db.refresh(call_record)
    
    # Schedule background task to make the call
    background_tasks.add_task(make_outbound_call, campaign, contact, call_record.id)
    
    return {
        "message": "Call initiated",
        "call_id": call_record.id,
        "uniqueid": call_record.uniqueid
    }

@api_router.post("/campaigns/{campaign_id}/calls/start-campaign")
async def start_campaign(campaign_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Start calling all contacts in a campaign"""
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    contacts = db.query(Contact).filter(Contact.campaign_id == campaign_id).all()
    
    if not contacts:
        raise HTTPException(status_code=400, detail="No contacts found in campaign")
    
    # Update campaign status
    campaign.status = CampaignStatus.ACTIVE
    db.commit()
    
    # Schedule calls for all contacts
    for contact in contacts:
        call_record = CallRecord(
            campaign_id=campaign_id,
            contact_id=contact.id,
            phone_number=contact.phone_number,
            call_status=CallStatus.PENDING,
            uniqueid=f"{campaign_id}_{contact.id}_{int(datetime.now(timezone.utc).timestamp())}"
        )
        db.add(call_record)
    
    db.commit()
    
    # Start background task for sequential calling
    background_tasks.add_task(process_campaign_calls, campaign_id)
    
    return {
        "message": "Campaign started",
        "total_contacts": len(contacts)
    }

@api_router.post("/campaigns/{campaign_id}/calls/stop")
async def stop_campaign(campaign_id: int, db: Session = Depends(get_db)):
    """Stop an active campaign"""
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    campaign.status = CampaignStatus.PAUSED
    db.commit()
    
    return {"message": "Campaign stopped"}

@api_router.get("/campaigns/{campaign_id}/calls", response_model=List[CallRecordResponse])
async def list_calls(campaign_id: int, db: Session = Depends(get_db)):
    """List all call records for a campaign"""
    calls = db.query(CallRecord).filter(
        CallRecord.campaign_id == campaign_id
    ).order_by(CallRecord.call_time.desc()).all()
    return calls

@api_router.get("/calls/{call_id}", response_model=CallRecordResponse)
async def get_call_record(call_id: int, db: Session = Depends(get_db)):
    """Get a specific call record"""
    call = db.query(CallRecord).filter(CallRecord.id == call_id).first()
    if not call:
        raise HTTPException(status_code=404, detail="Call record not found")
    return call

# Statistics Endpoints
@api_router.get("/campaigns/{campaign_id}/stats")
async def get_campaign_stats(campaign_id: int, db: Session = Depends(get_db)):
    """Get campaign statistics"""
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    total_contacts = db.query(Contact).filter(Contact.campaign_id == campaign_id).count()
    total_calls = db.query(CallRecord).filter(CallRecord.campaign_id == campaign_id).count()
    completed_calls = db.query(CallRecord).filter(
        CallRecord.campaign_id == campaign_id,
        CallRecord.call_status == CallStatus.COMPLETED
    ).count()
    
    # DTMF response breakdown
    dtmf_responses = db.query(CallRecord.dtmf_response).filter(
        CallRecord.campaign_id == campaign_id,
        CallRecord.dtmf_response.isnot(None)
    ).all()
    
    dtmf_breakdown = {}
    for response in dtmf_responses:
        key = response[0] if response[0] else 'no_response'
        dtmf_breakdown[key] = dtmf_breakdown.get(key, 0) + 1
    
    return {
        "campaign_id": campaign_id,
        "campaign_name": campaign.name,
        "status": campaign.status,
        "total_contacts": total_contacts,
        "total_calls": total_calls,
        "completed_calls": completed_calls,
        "success_rate": (completed_calls / total_calls * 100) if total_calls > 0 else 0,
        "dtmf_breakdown": dtmf_breakdown
    }

@api_router.get("/dashboard/stats")
async def get_dashboard_stats(db: Session = Depends(get_db)):
    """Get overall dashboard statistics"""
    total_campaigns = db.query(Campaign).count()
    active_campaigns = db.query(Campaign).filter(Campaign.status == CampaignStatus.ACTIVE).count()
    total_calls = db.query(CallRecord).count()
    completed_calls = db.query(CallRecord).filter(CallRecord.call_status == CallStatus.COMPLETED).count()
    
    # Recent calls (last 10)
    recent_calls = db.query(CallRecord).order_by(CallRecord.call_time.desc()).limit(10).all()
    
    return {
        "total_campaigns": total_campaigns,
        "active_campaigns": active_campaigns,
        "total_calls": total_calls,
        "completed_calls": completed_calls,
        "recent_calls": [
            {
                "id": call.id,
                "phone_number": call.phone_number,
                "status": call.call_status,
                "dtmf_response": call.dtmf_response,
                "call_time": call.call_time.isoformat()
            }
            for call in recent_calls
        ]
    }

# Background Tasks
async def make_outbound_call(campaign: Campaign, contact: Contact, call_record_id: int):
    """Make an outbound call using Asterisk"""
    db = SessionLocal()
    try:
        # Build channel string
        channel = f"SIP/{campaign.trunk_name}/{contact.phone_number}"
        
        # Originate call
        result = asterisk_manager.originate_call(
            channel=channel,
            exten=contact.phone_number,
            context="outbound_campaign",
            caller_id=campaign.caller_id
        )
        
        # Update call record
        call_record = db.query(CallRecord).filter(CallRecord.id == call_record_id).first()
        if call_record:
            if result['success']:
                call_record.call_status = CallStatus.INITIATED
                # Simulate DTMF response (in real scenario, this comes from AMI events)
                import random
                call_record.dtmf_response = str(random.choice([1, 2, None, None]))  # Simulate 50% response rate
                if call_record.dtmf_response:
                    call_record.call_status = CallStatus.COMPLETED
                    call_record.duration = random.randint(15, 120)
            else:
                call_record.call_status = CallStatus.FAILED
                call_record.notes = result.get('error', 'Unknown error')
            
            db.commit()
    finally:
        db.close()

async def process_campaign_calls(campaign_id: int):
    """Process all calls in a campaign sequentially"""
    import asyncio
    db = SessionLocal()
    try:
        campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
        if not campaign:
            return
        
        pending_calls = db.query(CallRecord).filter(
            CallRecord.campaign_id == campaign_id,
            CallRecord.call_status == CallStatus.PENDING
        ).all()
        
        for call_record in pending_calls:
            # Check if campaign is still active
            db.refresh(campaign)
            if campaign.status != CampaignStatus.ACTIVE:
                break
            
            contact = db.query(Contact).filter(Contact.id == call_record.contact_id).first()
            if contact:
                await make_outbound_call(campaign, contact, call_record.id)
                # Wait 5 seconds between calls
                await asyncio.sleep(5)
    finally:
        db.close()

# Root endpoint
@api_router.get("/")
async def root():
    return {"message": "Outbound Calling Bot API", "version": "1.0.0"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup():
    asterisk_manager.connect()
    logger.info("Application started")

@app.on_event("shutdown")
async def shutdown():
    asterisk_manager.disconnect()
    logger.info("Application shutdown")