PROJECT: The Source Company — Industrial IoT Renewable Energy Management Platform

CONTEXT FILES (always read these first, every session):
- PROJECT_PLAN.md — full product spec, architecture, data model, roadmap
- /frontend (or wherever the existing frontend lives) — EXISTING CODE, do not discard it

STACK (do not substitute without telling me why):
- Frontend: Next.js + TypeScript + Tailwind + shadcn/ui + Recharts
- Backend: FastAPI (Python), modular monolith, routers per domain (auth/products/telemetry/alerts/complaints/notifications/reports/audit)
- DB: PostgreSQL (use plain Postgres + table partitioning for telemetry; only add TimescaleDB if the extension is confirmed available — do not block on it)
- Cache/pubsub: Redis
- Realtime: Mosquitto (local, open-source MQTT broker) device→backend, FastAPI WebSocket backend→browser
- Background jobs: Celery + Redis, or arq if lighter is preferred — pick one and stay consistent
- Auth: JWT access+refresh, email-OTP 2FA (MVP), Google OAuth, RBAC (admin vs customer) enforced server-side on every endpoint
- All third-party services (Twilio, AWS SES, AWS S3, Google Maps, Weather API) MUST be stubbed behind an interface + an env flag like TWILIO_ENABLED=false. When disabled, log the action instead of calling the real API. The app must run fully on a laptop with zero real cloud credentials.

NON-NEGOTIABLE RULES:
1. Row-level scoping: a customer must never be able to query/see another customer's products, telemetry, complaints, or alerts — enforced in the query layer, not just hidden in the UI.
2. Audit log is append-only — block UPDATE/DELETE at the DB level (trigger or permissions), not just in app code.
3. Dashboards (admin + customer) must read "today's energy / uptime / lifetime energy" from ONE shared aggregation/rollup source — never compute the same metric two different ways in two different places.
4. Never store secrets in code or commit .env files. Use .env.example with placeholder values.
5. Use the EXISTING frontend code as the base. Do not scaffold a brand-new frontend project from scratch unless Phase 0's audit concludes the existing file truly cannot be extended (e.g. it's a static no-framework mockup) — if so, say so explicitly and propose a migration plan before doing it.

WORKFLOW RULE — SELF-TESTING AND SELF-FIXING (most important rule):
After every meaningful code change:
1. Run the relevant build/lint/typecheck/test command(s) for whatever you touched
   (e.g. `pytest`, `tsc --noEmit`, `npm run build`, `npm run lint`, `alembic upgrade head`).
2. If anything fails, read the actual error, fix the root cause yourself, and re-run.
3. Repeat step 1-2 until everything passes. Do not stop and ask me to fix errors for you.
4. Only interrupt me if: (a) you need a product/business decision that isn't in PROJECT_PLAN.md,
   (b) you need a real credential/API key that can't be stubbed, or (c) you've retried fixing
   the same failure 5+ times without progress — in that case stop and explain exactly what's blocking you.
5. Commit your work at the end of each phase with a clear message before reporting back to me.
6. At the end of a phase, give me a SHORT summary: what was built, what command proves it works,
   and what's deferred — not a full essay.