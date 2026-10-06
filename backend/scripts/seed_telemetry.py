import asyncio
from datetime import datetime, timezone, timedelta
import random
import uuid
from sqlalchemy.future import select

from app.database import get_session_factory
from app.models.company import Company
from app.models.product import Product
from app.models.telemetry import TelemetryRollup

async def seed():
    session_factory = get_session_factory()
    async with session_factory() as session:
        # Create a product if none
        res = await session.execute(select(Product))
        products = res.scalars().all()
        if not products:
            print("Creating a product...")
            
            p = Product(
                id=uuid.uuid4(),
                product_code="TEST-WIND-001",
                category="wind",
                status="online",
                serial_number="SN-TEST-1234",
            )
            session.add(p)
            await session.commit()
            products = [p]
            
        now = datetime.now(timezone.utc)
        rollups = []
        
        for product in products:
            # Generate daily rollups for the last 30 days
            for i in range(30):
                d = now - timedelta(days=29 - i)
                d = d.replace(hour=0, minute=0, second=0, microsecond=0)
                rollup = TelemetryRollup(
                    bucket=d,
                    product_id=product.id,
                    resolution='daily',
                    energy_sum=800 + random.random() * 200,
                    avg_power=10 + random.random() * 5,
                    avg_voltage=220 + random.random() * 10
                )
                rollups.append(rollup)

            # Generate yearly/monthly for 5 years back
            d = now.replace(year=now.year-4, month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
            for i in range(60): # 5 years of months
                rollup = TelemetryRollup(
                    bucket=d,
                    product_id=product.id,
                    resolution='monthly',
                    energy_sum=4000 + random.random() * 3000,
                    avg_power=10 + random.random() * 5,
                    avg_voltage=220 + random.random() * 10
                )
                rollups.append(rollup)
                next_month = d.replace(day=28) + timedelta(days=4)
                d = next_month.replace(day=1)

            # Generate hourly for today
            d = now.replace(hour=0, minute=0, second=0, microsecond=0)
            for i in range(24):
                rollup = TelemetryRollup(
                    bucket=d,
                    product_id=product.id,
                    resolution='hourly',
                    energy_sum=max(0, (i - 6) * 45/12 + random.random() * 6),
                    avg_power=2 + random.random() * 1,
                    avg_voltage=220 + random.random() * 10
                )
                rollups.append(rollup)
                d = d + timedelta(hours=1)
                
        await session.execute(TelemetryRollup.__table__.delete())
        
        session.add_all(rollups)
        await session.commit()
        print(f"Seeded {len(rollups)} telemetry rollups.")

if __name__ == "__main__":
    asyncio.run(seed())
