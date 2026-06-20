import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from google.cloud.sql.connector import Connector, IPTypes
from app.core.config import settings

Base = declarative_base()

# Initialize Cloud SQL Python Connector object
connector = Connector()

async def getconn():
    # Use private IP if specified, else public
    ip_type = IPTypes.PRIVATE if os.environ.get("PRIVATE_IP") else IPTypes.PUBLIC
    
    conn = await connector.connect_async(
        settings.INSTANCE_CONNECTION_NAME,
        "asyncpg",
        user=settings.DB_USER,
        password=settings.DB_PASS,
        db=settings.DB_NAME,
        ip_type=ip_type
    )
    return conn

# Configure database engine
if settings.LOCAL_DATABASE_URL:
    # Fallback to local database if URL is provided
    engine = create_async_engine(settings.LOCAL_DATABASE_URL, echo=True)
else:
    # Use Cloud SQL Python Connector
    engine = create_async_engine(
        "postgresql+asyncpg://",
        async_creator=getconn,
        echo=False,
    )

AsyncSessionLocal = async_sessionmaker(
    bind=engine, class_=AsyncSession, expire_on_commit=False
)

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
