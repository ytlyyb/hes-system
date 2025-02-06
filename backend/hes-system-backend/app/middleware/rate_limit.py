from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from datetime import datetime, timedelta
from collections import defaultdict
from app.core.config import settings

class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        self.requests = defaultdict(list)
        self.login_attempts = defaultdict(int)
        self.lockouts = defaultdict(datetime)
        
    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host
        now = datetime.now()
        path = request.url.path
        
        # Check if user is in lockout period
        if client_ip in self.lockouts:
            lockout_end = self.lockouts[client_ip]
            if now < lockout_end:
                raise HTTPException(
                    status_code=429,
                    detail=f"Account locked. Try again in {(lockout_end - now).seconds} seconds"
                )
            else:
                del self.lockouts[client_ip]
                self.login_attempts[client_ip] = 0
        
        # Special handling for login endpoint
        if path == "/api/v1/auth/login":
            attempts = self.login_attempts[client_ip]
            if attempts >= settings.MAX_LOGIN_ATTEMPTS:
                self.lockouts[client_ip] = now + timedelta(minutes=settings.LOCKOUT_DURATION)
                raise HTTPException(
                    status_code=429,
                    detail=f"Too many failed login attempts. Try again in {settings.LOCKOUT_DURATION} minutes"
                )
        
        # General rate limiting for all endpoints
        window_start = now - timedelta(minutes=1)
        self.requests[client_ip] = [
            req_time for req_time in self.requests[client_ip]
            if req_time > window_start
        ]
        
        if len(self.requests[client_ip]) >= 60:  # 60 requests per minute
            raise HTTPException(
                status_code=429,
                detail="Rate limit exceeded. Please try again later."
            )
            
        self.requests[client_ip].append(now)
        
        response = await call_next(request)
        
        # Track failed login attempts
        if path == "/api/v1/auth/login" and response.status_code == 401:
            self.login_attempts[client_ip] += 1
            
        return response
