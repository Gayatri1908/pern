# Production Deployment Guide

This guide details how to deploy The Source Company Industrial IoT Platform to a production virtual machine using Docker Compose.

## Prerequisites
1. A Linux Virtual Machine (e.g., Ubuntu 22.04 LTS) with at least 4GB RAM.
2. Docker and Docker Compose v2 installed.
3. Domain names configured with A records pointing to your VM's public IP:
   - `portal.thesource-company.in` (Frontend)
   - `api.thesource-company.in` (Backend)
   - `mqtt.thesource-company.in` (Mosquitto MQTT)
   - `www.thesource-company.in` (Public Site)

## Initial Setup

1. **Clone the Repository:**
   ```bash
   git clone <repository_url> thesource-iot
   cd thesource-iot
   ```

2. **Configure Secrets:**
   Copy the example environment file and configure the secrets.
   ```bash
   cp .env.production.example .env
   nano .env
   ```
   **Important:** 
   - Set a strong `POSTGRES_PASSWORD` and `REDIS_PASSWORD`.
   - Generate a secure `JWT_SECRET_KEY` using `openssl rand -hex 32`.
   - Set `ACME_EMAIL` to an active email address to receive Let's Encrypt certificate notices.

3. **Deploy the Stack:**
   Run the deployment script to build the images and start the containers.
   ```bash
   ./deploy.sh
   ```

## Architecture

- **Traefik** manages reverse proxying and automatically provisions SSL certificates via Let's Encrypt for all subdomains.
- **Backend (FastAPI)** and **Frontend (Next.js)** communicate over the internal Docker network (`thesource-net`).
- **PostgreSQL**, **Redis**, and **Mosquitto** are isolated in the backend network and are only accessible by the backend and Traefik (MQTT). Data is persisted via Docker volumes.

## Ongoing Maintenance

To update the application when new code is pushed to the `main` branch, simply SSH into the VM and run the deploy script:
```bash
cd thesource-iot
./deploy.sh
```

## Logs & Troubleshooting
View logs for all services:
```bash
docker compose -f docker-compose.prod.yml logs -f
```

View logs for a specific service:
```bash
docker compose -f docker-compose.prod.yml logs -f backend
```
