from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
import re

class UserBase(BaseModel):
    account_id: str = Field(..., min_length=6, max_length=25, pattern=r'^[A-Za-z_]+$')
    email: EmailStr
    full_name: str
    role: str
    preferred_language: str = Field(default="en", pattern=r'^(en|zh)$')

class UserCreate(UserBase):
    password: str = Field(..., min_length=6, max_length=25)

class UserLogin(BaseModel):
    account_id: str = Field(..., min_length=6, max_length=25, pattern=r'^[A-Za-z_]+$')
    password: str = Field(..., min_length=6, max_length=25)
    verification_code: str
    verification_id: str
    remember_me: bool = False

    def validate_verification_code(self, v: str) -> str:
        if not re.match(r'^-?\d{1,3}$', v):
            raise ValueError('Invalid verification code format')
        return v

class User(UserBase):
    id: int
    is_active: bool
    last_login: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {
        "from_attributes": True
    }

class UserInDB(User):
    hashed_password: str
    login_attempts: int
    last_login_attempt: Optional[datetime] = None
