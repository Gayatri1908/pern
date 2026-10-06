#!/bin/bash
set -e

echo "Starting Deployment for The Source Company - Industrial IoT Platform..."

# Ensure .env exists
if [ ! -f .env ]; then
    echo "Error: .env file is missing! Please copy .env.production.example to .env and configure secrets."
    exit 1
fi

echo "Pulling latest changes..."
git pull origin main

echo "Building production images..."
docker compose -f docker-compose.prod.yml build

echo "Bringing up containers..."
docker compose -f docker-compose.prod.yml up -d

echo "Removing dangling images..."
docker image prune -f

echo "Deployment completed successfully!"
