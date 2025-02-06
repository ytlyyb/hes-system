import random
from typing import Tuple
from datetime import datetime, timedelta
from app.core.config import settings

class VerificationCode:
    def __init__(self):
        self._cache = {}
        
    def generate_math_problem(self) -> Tuple[str, str, int]:
        """Generate a simple arithmetic problem and its solution.
        Returns:
            Tuple containing (unique_id, problem_text, expected_result)
        """
        a = random.randint(1, 10)
        b = random.randint(1, 10)
        op = random.choice(['+', '-'])
        problem = f"{a} {op} {b}"
        result = eval(problem)
        
        # Ensure result is within allowed range (-100 to 100)
        if result < -100 or result > 100:
            return self.generate_math_problem()
            
        # Generate unique ID for this verification code
        unique_id = str(random.getrandbits(32))
        expiry = datetime.now() + timedelta(minutes=settings.VERIFICATION_CODE_EXPIRY)
        
        # Store in cache with expiry
        self._cache[unique_id] = {
            "result": result,
            "expires_at": expiry
        }
        
        return unique_id, problem, result
        
    def verify_code(self, unique_id: str, answer: int) -> bool:
        """Verify a submitted verification code answer.
        Returns False if code is expired or invalid.
        """
        if unique_id not in self._cache:
            return False
            
        code_data = self._cache[unique_id]
        if datetime.now() > code_data["expires_at"]:
            del self._cache[unique_id]
            return False
            
        is_correct = code_data["result"] == answer
        del self._cache[unique_id]
        return is_correct
        
    def cleanup_expired(self):
        """Remove expired verification codes from cache"""
        now = datetime.now()
        expired = [k for k, v in self._cache.items() if now > v["expires_at"]]
        for k in expired:
            del self._cache[k]

# Global instance
verification = VerificationCode()
