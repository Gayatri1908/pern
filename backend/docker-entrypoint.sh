#!/bin/sh
set -e

echo "Waiting for database to be ready..."
python -c "
import asyncio
import sys
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

async def check():
    engine = create_async_engine('$DATABASE_URL')
    for i in range(30):
        try:
            async with engine.connect() as conn:
                await conn.execute(text('SELECT 1'))
            print('Database is ready.')
            sys.exit(0)
        except Exception as e:
            print(f'Database not ready yet: {e}')
            await asyncio.sleep(2)
    print('Database connection timed out.')
    sys.exit(1)

asyncio.run(check())
"

echo "Running database migrations..."
alembic upgrade head

echo "Seeding user data..."
python -m scripts.seed_users

echo "Starting FastAPI server..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
