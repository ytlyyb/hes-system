import os
import sys
from pathlib import Path

# Add the parent directory to Python path
sys.path.append(str(Path(__file__).parent.parent.parent))

from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import sessionmaker
from app.models.user import Base, User
from app.core.config import settings

def init_db():
    print("Creating database tables...")
    try:
        engine = create_engine(settings.DATABASE_URL, connect_args={"check_same_thread": False})
        inspector = inspect(engine)
        
        # Drop existing tables if they exist
        Base.metadata.drop_all(bind=engine)
        
        # Create all tables
        Base.metadata.create_all(bind=engine)
        
        # Verify tables were created
        if "users" in inspector.get_table_names():
            print("Database tables created successfully!")
        else:
            print("Error: Tables were not created properly")
            sys.exit(1)
            
    except Exception as e:
        print(f"Error initializing database: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    init_db()
