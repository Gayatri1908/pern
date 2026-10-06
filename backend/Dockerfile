FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy pyproject.toml to install dependencies first (for caching)
COPY pyproject.toml /app/

# Install backend dependencies
RUN pip install --no-cache-dir .

# Copy application code
COPY . /app

# Ensure entrypoint script is executable
RUN chmod +x /app/docker-entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["/app/docker-entrypoint.sh"]
