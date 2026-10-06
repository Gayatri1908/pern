"""Add EV charging station metrics and user approval fields

Revision ID: 9c2f5dd67e89
Revises: 8b1f4dc56c78
Create Date: 2026-07-21 20:50:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '9c2f5dd67e89'
down_revision: Union[str, Sequence[str], None] = '8b1f4dc56c78'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # User approval fields
    op.add_column('users', sa.Column('approval_status', sa.String(), server_default='approved', nullable=False))
    op.add_column('users', sa.Column('verification_notes', sa.String(), nullable=True))
    op.add_column('users', sa.Column('approved_by_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True))
    op.add_column('users', sa.Column('reviewed_at', sa.DateTime(timezone=True), nullable=True))

    # EV Charging Station fields
    op.add_column('products', sa.Column('station_name', sa.String(), nullable=True))
    op.add_column('products', sa.Column('battery_health', sa.Float(), server_default='95.0', nullable=False))
    op.add_column('products', sa.Column('battery_capacity_kwh', sa.Float(), server_default='120.0', nullable=True))
    op.add_column('products', sa.Column('current_charge_pct', sa.Float(), server_default='85.0', nullable=False))
    op.add_column('products', sa.Column('total_ports', sa.Integer(), server_default='4', nullable=False))
    op.add_column('products', sa.Column('available_ports', sa.Integer(), server_default='2', nullable=False))
    op.add_column('products', sa.Column('charger_type', sa.String(), server_default='Fast DC (150kW)', nullable=True))
    op.add_column('products', sa.Column('battery_type', sa.String(), server_default='LFP Solid-State', nullable=True))
    op.add_column('products', sa.Column('charging_price_per_kwh', sa.Float(), server_default='18.5', nullable=True))
    op.add_column('products', sa.Column('rating', sa.Float(), server_default='4.8', nullable=True))
    op.add_column('products', sa.Column('station_address', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('products', 'station_address')
    op.drop_column('products', 'rating')
    op.drop_column('products', 'charging_price_per_kwh')
    op.drop_column('products', 'battery_type')
    op.drop_column('products', 'charger_type')
    op.drop_column('products', 'available_ports')
    op.drop_column('products', 'total_ports')
    op.drop_column('products', 'current_charge_pct')
    op.drop_column('products', 'battery_capacity_kwh')
    op.drop_column('products', 'battery_health')
    op.drop_column('products', 'station_name')

    op.drop_column('users', 'reviewed_at')
    op.drop_column('users', 'approved_by_id')
    op.drop_column('users', 'verification_notes')
    op.drop_column('users', 'approval_status')
