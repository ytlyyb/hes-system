from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from app.db.session import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(String(25), unique=True, index=True)
    email = Column(String, unique=True, index=True)
    full_name = Column(String(100))
    hashed_password = Column(String)
    role = Column(String)  # student, teacher, admin
    preferred_language = Column(String(2), default="en")
    is_active = Column(Boolean, default=True)
    login_attempts = Column(Integer, default=0)
    last_login_attempt = Column(DateTime(timezone=True))
    last_login = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
