from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.user import UserCreate
from app.core.security import get_password_hash

def get_user_by_account_id(db: Session, account_id: str):
    return db.query(User).filter(User.account_id == account_id).first()

def create_user(db: Session, user: UserCreate):
    hashed_password = get_password_hash(user.password)
    db_user = User(
        account_id=user.account_id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        preferred_language=user.preferred_language,
        hashed_password=hashed_password,
        login_attempts=0
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def authenticate_user(db: Session, account_id: str, password: str):
    from app.core.security import verify_password
    from datetime import datetime
    user = get_user_by_account_id(db, account_id)
    if not user:
        return None
    if not verify_password(password, str(user.hashed_password)):
        user.login_attempts += 1
        user.last_login_attempt = datetime.utcnow()
        db.commit()
        return None
    user.login_attempts = 0
    user.last_login = datetime.utcnow()
    db.commit()
    return user
