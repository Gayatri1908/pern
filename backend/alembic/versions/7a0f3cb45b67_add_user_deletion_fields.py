"""Add user deletion fields

Revision ID: 7a0f3cb45b67
Revises: fe065df75a8e
Create Date: 2026-07-17 18:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7a0f3cb45b67'
down_revision: Union[str, Sequence[str], None] = 'fe065df75a8e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('users', sa.Column('deletion_requested_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('users', sa.Column('deletion_reason', sa.String(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('users', 'deletion_reason')
    op.drop_column('users', 'deletion_requested_at')
