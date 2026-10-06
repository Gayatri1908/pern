"""add company type

Revision ID: 53e7b61a43d1
Revises: 7a0f3cb45b67
Create Date: 2026-07-17

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '53e7b61a43d1'
down_revision = '7a0f3cb45b67'
branch_labels = None
depends_on = None

def upgrade():
    op.add_column('companies', sa.Column('company_type', sa.String(), nullable=True))

def downgrade():
    op.drop_column('companies', 'company_type')
