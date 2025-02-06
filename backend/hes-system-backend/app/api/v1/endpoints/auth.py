from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.utils.verification import verification
from app.schemas.user import UserLogin
from app.core.security import create_access_token
from app.api.v1 import crud
from datetime import timedelta
from app.core.config import settings

router = APIRouter()

@router.get("/verification-code")
def get_verification_code():
    """Generate a new verification code."""
    unique_id, problem, _ = verification.generate_math_problem()
    return {
        "id": unique_id,
        "problem": problem
    }

@router.post("/login")
def login(
    login_data: UserLogin,
    db: Session = Depends(get_db)
):
    """Login with account ID, password and verification code."""
    # Verify the verification code first
    if not verification.verify_code(login_data.verification_id, int(login_data.verification_code)):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid verification code"
        )

    # Authenticate user
    from app.api.v1 import crud
    user = crud.authenticate_user(db, login_data.account_id, login_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect account ID or password"
        )

    # Create access token
    access_token_expires = timedelta(
        days=settings.REMEMBER_ME_DAYS if login_data.remember_me else 1
    )
    access_token = create_access_token(
        data={"sub": user.account_id}, expires_delta=access_token_expires
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "account_id": user.account_id,
            "full_name": user.full_name,
            "role": user.role,
            "preferred_language": user.preferred_language
        }
    }
