from typing import Generator
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, declarative_base, Session
from app.core.config import settings

# Determine connect args
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    echo=False,
)

# Enable foreign keys for SQLite
if settings.DATABASE_URL.startswith("sqlite"):
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """Dependency for obtaining a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Initialize database tables and seed default user."""
    import app.models  # noqa: F401 - ensure models are registered
    Base.metadata.create_all(bind=engine)

    from app.models.user import User
    from app.core.security import hash_password

    db = SessionLocal()
    try:
        demo_user = db.query(User).filter(User.email == "demo@chatbox.ai").first()
        if not demo_user:
            demo_user = User(
                email="demo@chatbox.ai",
                password_hash=hash_password("password123"),
            )
            db.add(demo_user)
            db.commit()
    except Exception as e:
        print(f"Notice: Demo user seed note: {e}")
    finally:
        db.close()
