The Source Company – Industrial IoT Renewable Energy Management Platform
Project Overview
The Source Company is developing an Industrial IoT-based Renewable Energy Management Platform for monitoring and managing airborne wind turbine systems. These turbines generate electricity from wind energy and store it in ground-based battery systems to supply power to factories, industries, commercial buildings, and other consumers.
The platform consists of three major modules:
1. Public Website
2. Admin Dashboard
3. Customer (User) Dashboard
The system will communicate with IoT devices installed on every turbine and continuously receive live sensor data. The platform will display real-time monitoring, analytics, failures, maintenance information, weather conditions, alerts, reports, and notifications.

Technology Stack
Frontend
* React.js / Next.js
* TypeScript
* Tailwind CSS
* Shadcn UI
* Recharts / Apache ECharts
* Google Maps API
Backend
* FastAPI (Python)
Database
* PostgreSQL
Cache & Real-Time
* Redis
* WebSockets
* MQTT Broker (EMQX/Mosquitto)
Authentication
* JWT Authentication
* Google OAuth
* Twilio OTP
* Two-Factor Authentication (2FA)
Cloud
* AWS EC2
* AWS S3 (documents/images)
* Nginx
Notifications
* Twilio (WhatsApp & SMS)
* Email Service (SMTP/SES)
External APIs
* Weather API
* Google Maps API

User Roles
There are only two roles.
Admin
Complete control over the entire platform.
Customer/User
Can manage and monitor only their own registered products.

Authentication
Login Options
* Email + Password
* Google Login
* Phone Number + OTP (Twilio)
Signup
* Name
* Email
* Phone Number
* Company Name
* Factory Name
* GST (Optional)
* Address
* Password
Security
* JWT Authentication
* Refresh Tokens
* Password Encryption
* Session Management
* Login History
* Device History
Two-Factor Authentication (Mandatory Support)
Available for both Admin and User.
Options:
* Google Authenticator
* Email OTP
* SMS OTP

Admin Dashboard
After login, the admin should see a complete overview.
Dashboard Cards
* Total Registered Users
* Total Registered Products
* Active Products
* Failed Products
* Offline Products
* Products Under Maintenance
* Pending Product Registration Requests
* Pending Complaints
* Critical Alerts
* Total Energy Generated Today
* Total Monthly Energy
* Total Lifetime Energy
* Revenue Generated (Optional)
* Average Product Efficiency

Live Energy Analytics
Charts for:
* Live Energy Generation
* Hourly Generation
* Daily Generation
* Monthly Generation
* Yearly Generation
* Power Output Trends

Live Weather Dashboard
Display:
* Wind Speed
* Wind Direction
* Temperature
* Humidity
* Atmospheric Pressure
* Rainfall
* Weather Condition
* Air Density

User Management
Admin can:
* View all users
* Search users
* Filter users
* Edit user information
* Suspend users
* Activate users
* Delete users
* View user's registered products
* View complaint history
* Reset passwords
Each user profile displays:
* Profile Picture
* Name
* Phone
* Email
* Company
* Address
* Registration Date
* Last Login
* Number of Products

Product Management
Admin can:
* Add New Product
* Edit Product
* Delete Product
* Upload Product Images
* Assign Products
* Approve Registration Requests
* Reject Registration Requests
* Generate Product ID
* Generate QR Code
* Manage Warranty Information
* Update Firmware Version

Product Categories
* Air Turbine
* Battery
* Inverter
* Controller
* Wind Sensor
* Weather Station
* Gateway
* Other

Product Overview Page
All products are categorized.
Top Summary:
* Total Products
* Working Products
* Failed Products
* Offline Products
* Maintenance Products
* Total Power Generation
* Total Energy Generated
* Today's Energy
* Monthly Energy
* Lifetime Energy
Each product displays:
* Product Image
* Product ID
* Product Name
* Owner
* Product Category
* Installation Date
* Voltage
* Current
* Battery Percentage
* Battery Voltage
* Wind Speed
* Rotor RPM
* Rope Tension
* Temperature
* Humidity
* Power Output
* Energy Generated Today
* Total Energy Generated
* Signal Strength
* Current Status
* Last Updated

Live Monitoring Dashboard
The heart of the system.
Real-time monitoring using WebSockets and MQTT.
For every connected device display:
* Voltage
* Current
* Power
* Energy
* Battery %
* Battery Voltage
* Wind Speed
* Wind Direction
* Temperature
* Humidity
* Pressure
* Rope Tension
* Rotor RPM
* Signal Strength
* GPS Location
* Device Status
* Communication Status
* Last Updated Time
Dynamic updates without page refresh.

Live Charts
Available for every product.
Charts include:
* Voltage vs Time
* Current vs Time
* Battery vs Time
* Wind Speed vs Time
* Temperature vs Time
* Rope Tension vs Time
* RPM vs Time
* Energy Generated vs Time
* Power Output vs Time
Users can filter:
* Last Hour
* Last 24 Hours
* Last Week
* Last Month
* Custom Date Range

Threshold Management
Admin can configure threshold limits individually for every product.
Thresholds include:
* Voltage
* Current
* Battery Percentage
* Temperature
* Wind Speed
* Rope Tension
* Rotor RPM
* Power Output
* Custom Sensors
Whenever a threshold is exceeded:
* Generate Warning
* Generate Critical Alert
* Notify User
* Notify Admin
* Store Event in Database
* Save Event in Logs

Failure Monitoring
Whenever any product fails, show:
* Product ID
* Product Name
* Owner
* Failure Time
* Failure Reason
* Sensor Value
* Allowed Threshold
* Severity
* Suggested Solution
* Current Status
* Assigned Engineer (if applicable)
Examples:
* Battery Voltage Low
* Over Voltage
* Over Current
* High Rope Tension
* Rotor Jam
* Communication Lost
* Controller Failure
* Sensor Failure
* Generator Fault
* Weather Hazard
* Battery Failure

Product Location
Google Maps Integration.
Features:
* Live GPS Location
* Product Marker
* Status Color
* Search by Product ID
* Search by User
* Filter by City
* Filter by State
* Filter by Status
Clicking a marker opens:
* Product Details
* Live Sensor Values
* Current Status
* Power Output
* Alerts
* Navigation

Log Management
Every one minute automatically store:
* Timestamp
* Product ID
* Voltage
* Current
* Battery %
* Battery Voltage
* Power
* Energy
* Wind Speed
* Temperature
* Humidity
* Pressure
* Rope Tension
* RPM
* Weather Condition
* GPS Location
* Threshold Status
* Device Status
Retention Policy:
* Keep logs for 365 days
* Automatically delete older records
Download Options:
* CSV
* Excel (.xlsx)
* PDF
Search & Filters:
* Product
* User
* Date
* Failure
* Status

Complaint Management
Users can submit complaints.
Fields:
* Product
* Complaint Category
* Description
* Priority
* Images
* Videos
Admin can:
* Assign Engineer
* Update Status
* Add Remarks
* Upload Resolution
* Close Complaint
Complaint Status:
* New
* Assigned
* In Progress
* Waiting for Parts
* Resolved
* Closed

Product Registration Workflow
Customer fills registration form:
* Serial Number
* Purchase Invoice
* Installation Address
* GPS Location
* Installation Images
* Product Details
Admin receives request.
Admin can:
* Approve
* Reject
After approval:
* Product ID generated
* QR Code generated
* Product assigned to customer
* Confirmation Email
* WhatsApp Notification

Notification System
Notifications are sent through:
* Website
* Email
* WhatsApp
* SMS
Events:
* Product Offline
* Product Online
* Battery Low
* Threshold Exceeded
* High Rope Tension
* Over Voltage
* Over Current
* Weather Warning
* Maintenance Due
* Complaint Update
* Registration Approved
* Registration Rejected
* Firmware Update Available

Maintenance Module
Each product stores:
* Installation Date
* Warranty Expiry
* Last Service
* Next Service
* Service Engineer
* Service History
* Parts Replaced
* Notes
Automatic reminders before maintenance.

Reports
Generate:
* Daily Energy Report
* Weekly Energy Report
* Monthly Energy Report
* Annual Energy Report
* Device Health Report
* Failure Report
* Maintenance Report
* Complaint Report
* User Report
Download:
* CSV
* Excel
* PDF

Audit Log
Every admin activity is stored.
Includes:
* Admin Name
* Action
* Time
* IP Address
* Browser
* Device
Cannot be modified.

User Dashboard
Users only see their own registered products.
Dashboard Cards:
* Total Products
* Active Products
* Failed Products
* Today's Energy
* Monthly Energy
* Lifetime Energy
* Current Power Output
* Active Alerts

User Live Monitoring
Users can monitor all their products live.
Each product displays:
* Product Image
* Product ID
* Current Status
* Voltage
* Current
* Battery %
* Battery Voltage
* Wind Speed
* Rotor RPM
* Rope Tension
* Temperature
* Humidity
* Weather
* Power Output
* Today's Energy
* Total Energy
* GPS Location
* Last Updated
Live values update automatically.

User Live Charts
Users can view:
* Voltage
* Current
* Battery
* Wind Speed
* Power
* Energy
* Temperature
* Rope Tension
* RPM
Time filters:
* Live
* Daily
* Weekly
* Monthly

User Product Registration
Users can:
* Register New Product
* Upload Invoice
* Upload Installation Images
* Enter Serial Number
* Enter Installation Location
Registration Status:
* Pending
* Under Review
* Approved
* Rejected

User Complaints
Users can:
* Raise Complaint
* Upload Photos
* Upload Videos
* Track Complaint Status
* View Resolution

User Notifications
Receive automatic:
* Email
* WhatsApp
* SMS
* Website Notifications
For:
* Product Failure
* Threshold Exceeded
* Battery Low
* Maintenance Reminder
* Registration Approval
* Complaint Updates
* Firmware Updates

User Profile
Users can:
* Edit Profile
* Change Password
* Enable/Disable 2FA
* Manage Google Login
* Update Phone Number
* View Login History
* Manage Notification Preferences

Energy Analytics
Admin and Users can view analytics (users only for their own products).
Includes:
* Today's Energy Generation
* Weekly Generation
* Monthly Generation
* Lifetime Generation
* Current Power Output
* Efficiency Percentage
* Uptime Percentage
* Downtime History
* Carbon Emissions Saved (CO₂)
* Estimated Electricity Cost Savings (₹)
* Battery Health Trends
* Wind Performance Analysis

Future Enhancements
* AI-based Predictive Maintenance
* Machine Learning Failure Prediction
* OTA Firmware Updates
* Digital Warranty Management
* QR Code Product Scanning
* Technician Mobile App
* Customer Mobile App (Android & iOS)
* Role-Based Access Control (if additional roles are introduced)
* Dark/Light Mode
* Multi-language Support
* Backup & Disaster Recovery
* API Integration for third-party systems
* Prometheus & Grafana for infrastructure monitoring

Overall Goal
The platform will provide a complete Industrial IoT solution for renewable energy systems, enabling real-time monitoring, analytics, threshold management, fault detection, maintenance planning, user self-service, and secure administration. It is designed to scale from a few deployed air turbines to thousands of connected renewable energy devices while ensuring reliability, automation, and operational efficiency.
The Source Company — Renewable Energy IoT Platform: Comprehensive Plan
This plan is grounded in the spec you uploaded (airborne wind turbine fleet monitoring across Public Website / Admin Dashboard / Customer Dashboard) and is written as a build-ready blueprint. I couldn't crawl thesource-company.in directly (it blocks automated fetching), so where brand specifics matter I've flagged them as "confirm with marketing/brand assets" rather than guessing.

1. Context and Goals
Target audience
* Primary — B2B energy buyers: factory owners, plant/facility managers, sustainability or procurement officers who've bought or are evaluating airborne turbines. They're not power-systems engineers — they want plain confirmation that "my turbine is working and generating X today."
* Internal operators — Admin/Ops team: monitor the whole fleet, triage faults, approve registrations, dispatch field engineers.
* Field service engineers: consume failure/maintenance data (full mobile app is a later phase; MVP can expose a mobile-responsive view of their queue).
* Tertiary — prospects/investors: visit the public site for credibility, case studies, and lead capture. Airborne wind is an unfamiliar category in India, so the public site has to do real trust-building, not just brochureware.
Core value proposition
* One real-time pane of glass for energy yield, device health, and weather context — per device and fleet-wide.
* Faster fault detection → less downtime → more realized kWh → stronger customer confidence in a still-novel technology.
* Self-service (registration, complaints, reports) reduces support load on a presumably small ops team.
Success metrics
Metric	Target	Why it matters
Telemetry data completeness	≥98% of expected pings/device/day	Confirms IoT pipeline reliability, not just app reliability
Mean time to alert (threshold breach → notification delivered)	< 2 min	Core safety/ops promise
Dashboard data latency (sensor → UI)	< 3 sec	"Real-time" has to feel real-time
API availability	99.5%+ monthly	Customer trust
Registration request turnaround (submit → approve/reject)	< 48 hrs	Onboarding friction
Complaint resolution time (by priority)	P1 < 24h, P2 < 72h	Support SLA
% complaints raised via self-service portal (vs. phone/email)	> 60% within 6 months	Self-service adoption
Public site → demo request conversion	Baseline + track monthly	Marketing effectiveness
2. Feature Set (18 features, prioritized)
Legend: MVP (Phase 1, must ship) · P2 (Phase 2) · P3/Future
1. Company & User Onboarding — MVP
Story: "As a factory owner, I want to sign up with my company details so my turbines can be linked to my account."
* AC: Signup captures name, email, phone, company, factory name, GST (optional), address; email uniqueness enforced; password strength validated; verification email sent; account created in pending_verification until email confirmed.
2. Authentication (Email/Password + JWT) — MVP
Story: "As a user, I want to log in securely and stay logged in safely across sessions."
* AC: Access token (15 min) + refresh token (7–30 days, rotated on use); login history recorded (IP, device, browser); failed-login lockout after N attempts.
2b. Google OAuth, OTP login, 2FA — MVP-lite → P2
* MVP: Email-OTP based 2FA (cheap, no Twilio dependency) + Google OAuth login.
* P2: Twilio SMS OTP, Google Authenticator (TOTP) as a second 2FA option — gated behind Twilio account approval lead time.
* AC: User can enable/disable 2FA from profile; OAuth account can be linked/unlinked without losing data.
3. Product (Device) Registration Workflow — MVP
Story: "As a customer, I want to register my newly installed turbine so I can start monitoring it."
* AC: Form requires serial number, invoice upload, GPS + address, install photos; status flow pending → under_review → approved/rejected; on approval, system auto-generates Product ID + QR code and links device to user; rejection requires a reason visible to the user.
4. Admin Fleet Overview Dashboard — MVP
Story: "As an admin, I want a single screen showing fleet health so I know where to focus."
* AC: Cards (registered users, products by status, pending requests/complaints, critical alerts, today's/monthly/lifetime energy) refresh every ≤30s or on WebSocket push; clicking any card deep-links to the filtered list view.
5. Customer Personal Dashboard — MVP
Story: "As a customer, I want to see only my own products and their current status at a glance."
* AC: Strict row-level scoping by owner_user_id (enforced server-side, not just hidden in UI); shows same card pattern as admin but scoped; zero-state shown gracefully if no products yet.
6. Real-Time Live Monitoring (MQTT/WebSocket) — MVP
Story: "As a user, I want live sensor values for my turbine without refreshing the page."
* AC: Voltage/current/power/battery/wind/temp/RPM/rope tension update in-UI within 3s of device publish; visible "last updated" timestamp; graceful "device offline" state if no data for > configurable interval (e.g., 5 min).
7. Historical Charts & Time-Range Analytics — MVP
Story: "As a user, I want to see trends for a metric over time to understand performance."
* AC: Charts for voltage/current/battery/wind/temp/RPM/energy/power; filters: last hour, 24h, week, month (custom range = P2); chart data source = pre-aggregated rollups, not raw scan, for performance.
8. Threshold Configuration & Alerting — MVP
Story: "As an admin, I want to set safe operating limits per device so breaches trigger alerts automatically."
* AC: Per-product or default thresholds for voltage/current/battery/temp/wind/rope tension/RPM/power; breach creates an alert row, in-app + email notification within target SLA, and is visible on both admin and the owning customer's dashboard.
9. Failure/Incident Detection & Management — MVP
Story: "As an admin/engineer, I want full context on a failure so I can resolve it fast."
* AC: Each failure record shows product, owner, time, reason, sensor value vs. threshold, severity, suggested solution, status, assigned engineer; status transitions are logged with timestamp + actor.
10. Complaint Management — MVP
Story: "As a customer, I want to raise a complaint about my product and track its resolution."
* AC: Complaint form (product, category, description, priority, photo/video upload); status flow New → Assigned → In Progress → Waiting for Parts → Resolved → Closed; customer sees status + remarks in real time; admin can reassign and close with resolution notes.
11. Notification System (multi-channel) — MVP: in-app + email · P2: WhatsApp/SMS
Story: "As a user, I want to be notified the moment something needs my attention."
* AC: Notification events (offline, battery low, threshold exceeded, registration decision, complaint update) deduplicated (no spam-loop on sustained breach); user can manage channel preferences per event type (P2).
12. Audit Log (Admin actions) — MVP
Story: "As a platform owner, I want an immutable record of every admin action for accountability."
* AC: Append-only table (DB-level trigger blocks UPDATE/DELETE); captures admin, action, entity, IP, device/browser, timestamp; visible/searchable to super-admin only.
13. Public Marketing Website + Lead Capture — MVP
Story: "As a prospect, I want to understand the product and request a demo/quote."
* AC: SEO-optimized (SSR/SSG), product/technology explainer, case studies/testimonials slot, contact/lead form → CRM-able lead record + email notification to sales; Lighthouse perf score ≥ 90 on mobile.
14. Map-Based Fleet View (GPS) — P2
Story: "As an admin, I want to see all turbines on a map color-coded by status."
* AC: Markers colored by status; search by product ID/user; filters by city/state/status; marker click opens product detail panel.
15. Maintenance Scheduling & Reminders — P2
Story: "As an admin, I want automatic reminders before a device's service is due."
* AC: Stores install date, warranty expiry, last/next service, engineer, parts replaced; reminder notification fires N days before due date.
16. Reports & Data Export — P2
Story: "As a user, I want downloadable reports for my records or compliance."
* AC: Daily/weekly/monthly/annual energy, failure, maintenance, complaint, user reports; export to CSV/Excel/PDF; generation runs as a background job (not blocking the request) for large ranges.
17. Energy & Sustainability Analytics (CO₂ saved, ₹ cost savings, efficiency, uptime) — P2/P3
Story: "As a customer, I want to see the environmental and financial impact of my turbine."
* AC: Computed from a documented, versioned formula (grid-emission-factor based for CO₂; tariff-based for ₹ savings); formula and assumptions shown to the user (builds trust, avoids "made-up number" perception).
18. Predictive Maintenance / ML Failure Prediction — Future
* Deferred until ≥12 months of clean labeled telemetry + failure history exists — premature to build before then.

3. Architecture
3.1 High-level system design
                ┌─────────────────────────────┐
 [Turbine IoT]  │   Edge Gateway / Controller   │
                └─────────────┬────────────────┘
                              │ MQTT (TLS, per-device cert/token), QoS1
                              ▼
                ┌─────────────────────────────┐
                │   MQTT Broker (EMQX cluster) │
                └─────────────┬────────────────┘
                              │ subscribe: devices/{product_id}/telemetry
                              ▼
                ┌─────────────────────────────┐
                │  Ingestion Worker (Python)    │  - validate (pydantic)
                │                               │  - write telemetry (Timescale)
                │                               │  - update Redis "latest state"
                │                               │  - evaluate thresholds
                └───────┬───────────┬───────────┘
                        │           │ breach → insert alert + publish event
                        ▼           ▼
              ┌────────────┐  ┌─────────────────┐
              │ PostgreSQL │  │ Redis (pub/sub,  │
              │ +Timescale │  │ cache, sessions, │
              │ (telemetry,│  │ Celery broker)   │
              │ core tables│  └─────────┬────────┘
              └─────┬──────┘            │
                    │                   ▼
                    │         ┌──────────────────────┐
                    │         │ WebSocket Gateway      │──► Admin Dashboard (Next.js)
                    │         │ (FastAPI, scoped by    │──► Customer Dashboard (Next.js)
                    │         │ ownership/role)        │
                    │         └──────────────────────┘
                    ▼
        ┌──────────────────────┐        ┌─────────────────────┐
        │ FastAPI REST API      │◄──────►│ Public Website        │
        │ (auth, products,      │        │ (Next.js SSR/SSG)     │
        │ complaints, reports…) │        └─────────────────────┘
        └─────────┬─────────────┘
                  │
        ┌─────────┴─────────────┐
        │ Integrations:          │
        │ Twilio (SMS/WhatsApp), │
        │ SES (email), Google    │
        │ Maps, Weather API, S3   │
        └─────────────────────────┘
3.2 Tech stack decisions (vs. the original spec)
Layer	Choice	Note
Frontend	Next.js (3 apps: marketing, admin, customer) in a Turborepo monorepo + TS + Tailwind + shadcn/ui	Marketing app uses SSR/SSG for SEO; dashboards are mostly CSR behind auth. Shared UI/component package avoids drift.
Charts	Recharts for standard charts; ECharts only if you need heavier real-time chart performance (e.g., 1-second tick live charts)	Don't adopt both — pick one to start (Recharts), add ECharts only if proven necessary.
Backend	FastAPI, modular monolith (routers: auth/products/telemetry/alerts/complaints/notifications/reports/audit)	Don't start with microservices — split out the ingestion/WebSocket service first if/when it needs independent scaling.
Background jobs	Celery + Redis (or arq, lighter-weight, async-native)	Notification dispatch, report generation, retention cleanup, scheduled reminders.
Realtime transport	MQTT (EMQX) for device→cloud; Redis pub/sub + FastAPI WebSocket for cloud→browser	Don't put browsers directly on MQTT — keeps device security boundary clean.
Database	PostgreSQL + TimescaleDB extension for telemetry hypertables	Decision point: if you can't self-host the Timescale extension on your chosen host, fall back to plain Postgres + pg_partman for time-based partitioning. Confirm hosting option before committing schema design.
Cache/queue	Redis	Sessions/rate-limiting, "latest value" cache, pub/sub fan-out, Celery broker.
Storage	AWS S3 (uploads, reports, static assets) + CloudFront CDN	Lifecycle policies to control cost as install-photo/video volume grows.
Auth	JWT (access+refresh) + Google OAuth + Twilio OTP/2FA	As specified; rotate refresh tokens on use; store only token hashes.
Hosting	AWS, region ap-south-1 (Mumbai)	Data residency for Indian customers/regulation.
3.3 Core data model (entities)
Entity	Purpose	Key fields
companies	Customer org	name, gst_no, address
users	Admin/customer accounts	role, email, phone, password_hash, google_id, 2fa_enabled
login_history	Security audit	user_id, ip, device, browser, success, created_at
products	Each turbine/battery/inverter/etc.	product_code (QR), category, owner_user_id, serial_number, status, firmware_version, install_lat/lng
product_telemetry (hypertable)	Raw sensor stream	time, product_id, voltage, current, power, battery_pct, wind_speed, rope_tension, rotor_rpm, comm_status
telemetry_rollup_{hourly,daily,monthly}	Pre-aggregated continuous aggregates	product_id, bucket, avg/min/max, energy_sum
thresholds	Per-product/default limits	metric, min/max, severity, notify_channels
alerts	Threshold breaches / failures	product_id, metric, value, severity, status, suggested_solution, assigned_engineer_id
registration_requests	Onboarding queue	serial_number, invoice_url, gps, status, reviewed_by
complaints	Support tickets	product_id, category, priority, status, media[]
maintenance_records	Service history	type, engineer_id, scheduled_at, completed_at, parts_replaced[]
notifications	Outbound message log	channel, event_type, status, payload
audit_logs	Immutable admin action trail	admin_user_id, action, entity, ip, created_at
reports	Generated report metadata	type, params, file_url
device_credentials	Per-device MQTT auth	product_id, cert_fingerprint/token_hash, rotated_at
4. Integrations
Service	Purpose	Why this one	Data flow
Twilio	OTP, SMS, WhatsApp Business notifications	Spec requirement; mature India support	App → Twilio API → device; webhook for delivery status back into notifications.status
AWS SES	Transactional email	Cheaper/more reliable at scale than raw SMTP	App → SES → recipient; bounces/complaints via SNS webhook
Google OAuth	Social login	Reduces signup friction	Standard OAuth2 redirect flow; only id/email/name scopes requested
Google Maps Platform	Fleet map, geocoding install address	Spec requirement; best India coverage	Browser loads Maps JS API (server never embeds raw API key in shared logs); Geocoding API called server-side during registration
Weather API (OpenWeatherMap or Visual Crossing; consider IMD-sourced data for India-specific accuracy)	Wind/temp/humidity/pressure context overlay	Cross-checks against on-device sensors; useful when a device sensor itself is suspect	Backend polls per-site coordinates on a schedule, caches in Redis (don't call per-dashboard-refresh — rate limits + cost)
EMQX (self-hosted/cloud)	MQTT broker for device telemetry	Production-grade clustering, TLS, per-device ACLs	Devices publish → broker → ingestion worker subscribes
Sentry	Error tracking (frontend + backend)	Fast triage of real production bugs	SDK auto-captures exceptions, tagged by service/release
Prometheus + Grafana	Infra/app metrics (mentioned in your spec's future list — pull into MVP for ops sanity)	Open-source, self-hostable, free at this scale	Exporters on API/MQTT/DB → Prometheus scrape → Grafana dashboards
Razorpay/Stripe (optional, future)	If "Revenue Generated" card becomes real billing	Razorpay for India-first billing/GST invoicing	Only if/when monetization model is finalized — don't build prematurely
5. Non-Functional Requirements
Performance
* API p95 latency < 300ms for CRUD endpoints; telemetry ingestion → DB write < 500ms; sensor → dashboard UI < 3s end-to-end.
* Dashboard initial load (LCP) < 2.5s on 4G; charts query pre-aggregated rollups, never raw multi-million-row scans.
Security
* TLS everywhere (browser↔API, device↔broker via per-device cert or signed token, never shared credentials across devices).
* OWASP Top 10 mitigations: parameterized queries (ORM), input validation (pydantic), rate limiting on auth endpoints, CSRF protection on cookie-based flows if used, strict CORS.
* Secrets in AWS Secrets Manager/SSM, never in repo or env files committed to git.
* RBAC enforced server-side on every endpoint (admin vs. customer), not just hidden in UI.
* Device credentials rotatable; revoke-on-compromise path documented.
Accessibility
* WCAG 2.1 AA target for public site and dashboards: semantic HTML, keyboard navigation, visible focus states, color contrast ≥4.5:1, ARIA live regions for real-time alert banners (so screen readers announce critical alerts), alt text for status icons (don't rely on color alone for status — pair with text/icon).
Scalability
* Stateless API behind ALB + auto-scaling group; MQTT broker clustered (EMQX supports this natively); Timescale compression + retention policies to keep storage growth bounded as fleet size grows; Redis used to avoid hammering Postgres for "current status" reads.
Compliance
* India's Digital Personal Data Protection Act (DPDP) 2023: explicit consent for notification channels (especially WhatsApp — also a Meta Business policy requirement), data minimization, right-to-deletion path for user accounts, data residency in ap-south-1.
* GST field handling — store but don't validate/display beyond what's legally required; no payment-card data stored anywhere (if billing is ever added, use a PCI-compliant processor, never store card data yourself).
* 365-day telemetry retention with automatic deletion as specified — document this as a published policy, not just code behavior.

6. UX/UI Plan
Sitemap
Public Website
├── Home (hero, value prop, trust signals)
├── Technology / How it works
├── Products (categories: turbine, battery, inverter…)
├── Case Studies / Customers
├── About / Sustainability impact
├── Contact / Request Demo (lead capture)
└── Login / Signup

Admin Portal (/admin)
├── Dashboard (overview cards + analytics)
├── Users (list, profile, suspend/activate)
├── Products (list, detail, registration approvals)
├── Live Monitoring (per-device real-time view)
├── Alerts & Failures
├── Complaints
├── Maintenance (P2)
├── Reports (P2)
├── Audit Log
└── Settings (thresholds, notification templates)

Customer Portal (/app)
├── Dashboard (my products overview)
├── My Products (list → detail: live + history)
├── Register New Product
├── Complaints (raise/track)
├── Notifications
├── Reports (P2)
└── Profile / Security (2FA, sessions)
Wireframe sketch — example: Customer product detail screen
┌──────────────────────────────────────────────┐
│ ← Back   Product: TS-AT-0042   [● Active]      │
├──────────────────────────────────────────────┤
│ [Photo]  Power Output: 4.2 kW   Battery: 78%   │
│          Today's Energy: 31.4 kWh  Wind: 14m/s │
├──────────────────────────────────────────────┤
│  [ Voltage ][ Current ][ Battery ][ Wind ]…    │  ← tabbed metric charts
│  ┌────────────────────────────────────────┐   │
│  │   line chart, time-range selector       │   │
│  └────────────────────────────────────────┘   │
├──────────────────────────────────────────────┤
│ Active Alerts: none                            │
│ Last updated: 12s ago                          │
└──────────────────────────────────────────────┘
(Real Figma/Visual mockups would be the next concrete step — happy to sketch one as an inline visual if useful, just say so.)
Accessibility considerations: status communicated via icon + text + color (never color alone); live-updating regions marked aria-live="polite" (critical alerts assertive); all charts paired with a data-table/CSV fallback for screen-reader users; form errors announced inline, not just visually.

7. Data & Analytics
Event tracking plan (sample taxonomy)
Event	Trigger	Key properties
user_signed_up	Successful signup	role, company_id, signup_method
product_registered	Registration approved	product_id, category, install_location
threshold_breached	Threshold evaluator fires	product_id, metric, value, severity
alert_acknowledged	Admin/user acks alert	alert_id, time_to_ack
complaint_raised	Complaint submitted	product_id, category, priority
complaint_resolved	Status → Resolved	time_to_resolution
report_downloaded	Export clicked	report_type, format
device_went_offline	No telemetry past threshold interval	product_id, last_seen
Keeping stats consistent
The single biggest risk in this kind of system is the admin dashboard and the customer dashboard computing "today's energy" or "uptime %" slightly differently and eroding trust. Mitigate by:
* One aggregation service, one source of truth: rollups (telemetry_rollup_hourly/daily/monthly) are computed once via TimescaleDB continuous aggregates (or a scheduled job if not using Timescale), and every dashboard/report query reads from rollups — never recomputed ad hoc in the frontend or in a separate query path.
* Idempotent jobs: aggregation jobs are safe to re-run (upsert, not insert) so late-arriving telemetry (a device that was briefly offline and backfills) doesn't create duplicate or drifting totals.
* Versioned formulas for derived metrics (CO₂ saved, ₹ savings, efficiency %) stored as config, not hardcoded — so when assumptions change, historical figures don't silently shift without a changelog entry.
* A reconciliation job that periodically re-sums raw telemetry against rollups and flags discrepancies above a tolerance — catches aggregation bugs early.
Dashboards
* Internal ops: Grafana on Prometheus metrics (infra health) — separate from the customer-facing product dashboards.
* Product dashboards: built directly into the admin/customer Next.js apps, backed by the rollup tables above.

8. Roadmap & Milestones
Phase	Duration	Deliverables	Key risks → mitigation
0 — Discovery & Design	2–3 wks	Finalized requirements, wireframes/mockups, ERD, API contract draft, infra decisions (Timescale hosting confirmed)	Scope creep → freeze MVP feature list before coding starts
1 — MVP	10–12 wks	Auth, onboarding, registration workflow, admin+customer dashboards, live monitoring, thresholds/alerts, complaints, audit log, public website, email notifications	IoT pipeline complexity underestimated → build & load-test ingestion path in week 1–2, in parallel with CRUD screens
2 — Hardening & Expansion	6–8 wks	WhatsApp/SMS notifications, maps view, maintenance module, reports/export, extended energy analytics, 2FA via authenticator app	Twilio WhatsApp Business approval delay (2–4 wks) → apply at start of Phase 2, not when needed
3 — Scale & Intelligence	Ongoing	Predictive maintenance (after ≥12mo data), technician/customer mobile apps, OTA firmware, multi-language, DR hardening	Insufficient labeled failure data for ML → don't commit a delivery date until data volume is validated
9. DevOps & Deployment
* CI/CD: GitHub Actions — lint → unit tests → build → Docker image → push to ECR → deploy to staging automatically on merge to main; production deploy gated behind manual approval.
* Environments: dev (shared, ephemeral data) → staging (prod-like, used for QA + demo) → prod (Mumbai region, Multi-AZ where feasible). Separate AWS accounts or at minimum separate VPCs per environment to prevent cross-contamination.
* Infra as code: Terraform for VPC/RDS/EC2/S3/IAM — avoids click-ops drift between environments.
* Monitoring: Prometheus+Grafana (infra), Sentry (app errors), CloudWatch (AWS-native logs/alarms), uptime checks on public endpoints (e.g., a simple synthetic check hitting /healthz every minute), MQTT broker connection-count/queue-depth alerts.
* Backups: Automated Postgres snapshots + point-in-time recovery; S3 versioning on uploads/reports buckets; defined targets — RPO ≤ 15 min, RTO ≤ 4 hrs for the database; quarterly restore drills (an untested backup isn't a backup).
* Disaster recovery: documented runbook (who does what, in what order) for: DB failover, broker cluster node loss, full region outage (cross-region snapshot copy as a baseline, full active-DR is likely overkill at this scale initially).

10. Constraints
* Budget: AWS + Twilio + Google Maps costs scale with device count and notification volume — model cost-per-device before committing to SMS/WhatsApp as default channels (email/in-app should be the free-tier default; SMS/WhatsApp reserved for critical alerts).
* Timeline: realistic MVP for a small team is 4–6 months, not weeks, given the IoT ingestion pipeline alone (this is the part most teams underestimate).
* Regulatory: DPDP Act 2023 compliance for personal data; WhatsApp Business messaging requires Meta template approval and opted-in consent — build the consent flow before the notification feature, not after.
* Platform: Google Maps API billing scales with map loads — cache geocoding results, don't re-geocode on every page view; Twilio WhatsApp Business onboarding has a multi-week approval lead time — start that process early.
* Physical/operational: actual turbine siting involves aviation/airspace coordination (per the airborne-wind-energy research above) — this is outside software scope, but registration workflow should capture whatever compliance documentation your ops team needs (e.g., site clearance) as an upload field.

11. Deliverables
* PRD (this document, refined with your team's sign-off on MVP scope).
* API specification: auto-generated OpenAPI/Swagger directly from FastAPI (/docs), exported and versioned alongside releases.
* Data schema / ERD: the table list in §3.3, formalized as a versioned migration history (Alembic).
* Architecture diagram: formalize the §3.1 sketch in a proper diagramming tool for stakeholder review.
* Security & compliance checklist: DPDP consent flows, retention policy doc, RBAC matrix.
* Accessibility checklist: WCAG 2.1 AA audit before each major UI release.
* Runbooks: deploy, rollback, DR/failover, on-call escalation.
Minimal reproducible example — the real-time ingestion path (illustrative pseudocode, not a deliverable file, just to validate the core architectural idea before building it for real):
# Ingestion worker: MQTT -> validate -> store -> threshold check -> fan-out
import asyncio_mqtt as aiomqtt
from pydantic import BaseModel

class TelemetryPayload(BaseModel):
    product_id: str
    voltage: float
    current: float
    battery_pct: float
    wind_speed: float
    rope_tension: float
    rotor_rpm: float
    timestamp: float

async def handle_message(payload: TelemetryPayload):
    await db.insert_telemetry(payload)                 # TimescaleDB hypertable
    await redis.set(f"latest:{payload.product_id}", payload.json())
    breach = await check_thresholds(payload)            # against `thresholds` table
    if breach:
        await db.insert_alert(payload.product_id, breach)
        await redis.publish(f"events:{payload.product_id}", breach.json())
        await notify(payload.product_id, breach)        # email/SMS/WhatsApp dispatch

async def main():
    async with aiomqtt.Client("broker.thesource.example") as client:
        async with client.messages() as messages:
            await client.subscribe("devices/+/telemetry")
            async for message in messages:
                payload = TelemetryPayload.parse_raw(message.payload)
                await handle_message(payload)
This is the piece worth prototyping first — everything else (CRUD screens, auth, complaints) is comparatively standard web-dev work, but the ingestion-to-realtime-dashboard path is where the actual technical risk lives.


