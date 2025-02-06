from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.user import UserCreate, User
from app.api.v1 import crud

router = APIRouter()

@router.post("", response_model=User)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_account_id(db, account_id=user.account_id)
    if db_user:
        raise HTTPException(status_code=400, detail="Account ID already registered")
    return crud.create_user(db=db, user=user)
