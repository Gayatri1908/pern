"""Add description column to complaints table

Revision ID: 8b1f4dc56c78
Revises: 7a0f3cb45b67
Create Date: 2026-07-17 18:46:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8b1f4dc56c78'
down_revision: Union[str, Sequence[str], None] = '53e7b61a43d1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('complaints', sa.Column('description', sa.String(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('complaints', 'description')
