from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import time

app = FastAPI(
    title="INTELLIMED Backend API",
    description="Smart Medicine Dispenser & Reminder API",
    version="1.0.0"
)

# Enable CORS for local Vite and Vercel deployments
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Reminder(BaseModel):
    id: str
    medicineName: str
    time: str
    dosage: Optional[str] = "1 Dose"
    enabled: bool = True
    takenToday: bool = False

class CreateReminderDTO(BaseModel):
    medicineName: str
    time: str
    dosage: Optional[str] = "1 Dose"

class UpdateReminderDTO(BaseModel):
    enabled: Optional[bool] = None
    takenToday: Optional[bool] = None

# In-memory store
reminders_db: List[Reminder] = [
    Reminder(
        id="1",
        medicineName="Paracetamol",
        time="08:00",
        dosage="1 Tablet after breakfast",
        enabled=True,
        takenToday=True
    ),
    Reminder(
        id="2",
        medicineName="Amoxicillin",
        time="14:00",
        dosage="1 Capsule after lunch",
        enabled=True,
        takenToday=False
    ),
    Reminder(
        id="3",
        medicineName="Vitamin D3",
        time="20:30",
        dosage="1 Tablet with milk",
        enabled=True,
        takenToday=False
    )
]

@app.get("/")
def root():
    return {"status": "ok", "service": "INTELLIMED Backend API"}

@app.get("/api/reminders", response_model=List[Reminder])
def get_reminders():
    return reminders_db

@app.post("/api/reminders", response_model=Reminder, status_code=status.HTTP_201_CREATED)
def create_reminder(payload: CreateReminderDTO):
    new_item = Reminder(
        id=str(int(time.time() * 1000)),
        medicineName=payload.medicineName,
        time=payload.time,
        dosage=payload.dosage or "1 Dose",
        enabled=True,
        takenToday=False
    )
    reminders_db.append(new_item)
    return new_item

@app.patch("/api/reminders/{reminder_id}", response_model=Reminder)
def update_reminder(reminder_id: str, payload: UpdateReminderDTO):
    for r in reminders_db:
        if r.id == reminder_id:
            if payload.enabled is not None:
                r.enabled = payload.enabled
            if payload.takenToday is not None:
                r.takenToday = payload.takenToday
            return r
    raise HTTPException(status_code=404, detail="Reminder not found")

@app.delete("/api/reminders/{reminder_id}")
def delete_reminder(reminder_id: str):
    global reminders_db
    initial_len = len(reminders_db)
    reminders_db = [r for r in reminders_db if r.id != reminder_id]
    if len(reminders_db) == initial_len:
        raise HTTPException(status_code=404, detail="Reminder not found")
    return {"success": True, "message": "Deleted successfully"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
