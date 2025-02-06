from datetime import timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.token import Token, TokenData
from app.schemas.user import UserCreate, UserInDB, User as UserSchema
from app.core.config import settings
from app.core.security import create_access_token
from app.db.session import get_db
from app.api.v1.crud import get_user_by_email, create_user, authenticate_user

router = APIRouter()

@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/register", response_model=UserSchema)
async def register(
    user: UserCreate,
    db: Session = Depends(get_db)
):
    try:
        db_user = get_user_by_email(db, email=user.email)
        if db_user:
            raise HTTPException(
                status_code=400,
                detail="Email already registered"
            )
        return create_user(db=db, user=user)
    except Exception as e:
        print(f"Registration error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )
