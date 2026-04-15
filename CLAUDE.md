# CLAUDE.md — किसान बजार (Agricultural Market Price Portal)

## Project Overview

A full-stack web portal that shows daily vegetable/fruit market prices
from Kalimati Market (Nepal), allows farmers to list their crops, and
enables buyers to contact farmers directly.

**Goal:** Remove middlemen, give farmers fair market price access.
**Target Users:** Farmers (किसान), Buyers (खरिदकर्ता), Admins

---

## Problem This Project Solves

Without this app:
  Farmer → middleman 1 → middleman 2 → middleman 3 → Buyer
  Farmer gets: Rs.15/kg | Buyer pays: Rs.60/kg | Middlemen take: Rs.45/kg

With this app:
  Farmer → Kisaan Bazar → Buyer
  Farmer gets fair price. Buyer pays less. Middlemen removed.

---

## Tech Stack

| Layer      | Technology                                      |
|------------|-------------------------------------------------|
| Backend    | Python 3.9 / Django 4.2.29 / Django REST Framework |
| Database   | PostgreSQL 15+                                  |
| Cache      | Redis                                           |
| Scraper    | BeautifulSoup4 + Requests + APScheduler         |
| SMS        | Sparrow SMS API (Nepal)                         |
| Auth       | JWT (djangorestframework-simplejwt)             |
| Env        | django-environ                                  |
| Frontend   | React + Vite + Tailwind CSS                     |
| Hosting    | Render / Railway (planned)                      |

---

## Project Structure

```
KisanBazar/
├── CLAUDE.md                     ← You are here
├── .gitignore
│
├── backend/                      ← Django backend
│   ├── manage.py
│   ├── requirements.txt
│   ├── .env                      ← Never commit this
│   ├── .env.example
│   │
│   ├── config/                   ← Django project settings
│   │   ├── __init__.py
│   │   ├── settings/
│   │   │   ├── __init__.py
│   │   │   ├── base.py           ← Shared settings
│   │   │   ├── development.py    ← DEBUG=True, open CORS
│   │   │   └── production.py     ← HTTPS, strict CORS
│   │   ├── urls.py               ← All API routes
│   │   └── wsgi.py
│   │
│   └── apps/
│       ├── users/                ← Farmer & Buyer accounts
│       ├── crops/                ← Crop master list (66 crops)
│       ├── prices/               ← Daily Kalimati price data
│       ├── listings/             ← Farmer crop listings
│       ├── orders/               ← Buyer order requests
│       ├── alerts/               ← SMS/Email price alerts
│       └── scraper/              ← Kalimati auto price fetcher
│
└── FrontEnd/                     ← React frontend
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   ├── context/
    │   │   └── LanguageContext.jsx  ← Nepali/English toggle
    │   └── utils/
    │       └── districts.js         ← All 77 Nepal districts
    ├── index.html
    └── vite.config.js
```

---

## Database Models

### users/models.py
```python
User (extends AbstractUser)
- role        : CharField  → FARMER | BUYER | ADMIN
- phone       : CharField
- district    : CharField  → One of Nepal's 77 districts
- address     : TextField
- is_verified : BooleanField
- created_at  : DateTimeField (auto)
- updated_at  : DateTimeField (auto)
```

### crops/models.py
```python
Crop
- name_nepali  : CharField  → आलु
- name_english : CharField  → Potato
- unit         : CharField  → kg / piece / dozen
- category     : CharField  → VEGETABLE | FRUIT | OTHER
- emoji        : CharField  → 🥔
- is_active    : BooleanField
- created_at   : DateTimeField (auto)
- updated_at   : DateTimeField (auto)
```

### prices/models.py
```python
DailyPrice
- crop      : FK(Crop)
- date      : DateField
- min_price : DecimalField  → NPR
- max_price : DecimalField  → NPR
- avg_price : DecimalField  → Auto-calculated on save
- source    : CharField     → KALIMATI | MANUAL
- created_at: DateTimeField (auto)
- updated_at: DateTimeField (auto)
```

### listings/models.py
```python
Listing
- farmer       : FK(User)   → Must be FARMER role
- crop         : FK(Crop)
- quantity_kg  : DecimalField
- asking_price : DecimalField  → NPR
- description  : TextField
- district     : CharField
- is_available : BooleanField  → Soft delete
- photo        : ImageField
- created_at   : DateTimeField (auto)
- updated_at   : DateTimeField (auto)
```

### orders/models.py
```python
Order
- buyer      : FK(User)     → Must be BUYER role
- listing    : FK(Listing)
- quantity_kg: DecimalField
- status     : CharField    → PENDING | ACCEPTED | REJECTED | COMPLETED
- message    : TextField
- created_at : DateTimeField (auto)
- updated_at : DateTimeField (auto)
```

### alerts/models.py
```python
PriceAlert
- user            : FK(User)
- crop            : FK(Crop)
- threshold_price : DecimalField  → NPR
- condition       : CharField     → ABOVE | BELOW
- via_sms         : BooleanField
- via_email       : BooleanField
- is_active       : BooleanField  → Soft delete
- created_at      : DateTimeField (auto)
- updated_at      : DateTimeField (auto)
```

---

## API Endpoints

### Auth
```
POST   /api/auth/register/       ← Farmer/Buyer signup
POST   /api/auth/login/          ← Returns JWT tokens
POST   /api/auth/refresh/        ← Refresh access token
GET    /api/auth/me/             ← Current user info
```

### Prices (Public)
```
GET    /api/prices/today/              ← All today's prices
GET    /api/prices/today/?crop=आलु     ← Filter by crop name
GET    /api/prices/today/?date=2026-04-13  ← Filter by date
GET    /api/prices/history/{crop_id}/  ← 30-day price history
GET    /api/prices/trending/           ← Top 10 by avg price
```

### Crops (Public)
```
GET    /api/crops/       ← All crops list (paginated)
GET    /api/crops/{id}/  ← Single crop detail
```

### Listings
```
GET    /api/listings/              ← All active listings (public)
GET    /api/listings/?district=काठमाडौं  ← Filter by district
GET    /api/listings/?crop=आलु     ← Filter by crop
POST   /api/listings/              ← Create listing (FARMER only)
PUT    /api/listings/{id}/         ← Edit listing (owner only)
DELETE /api/listings/{id}/         ← Soft delete (owner only)
GET    /api/listings/my/           ← My own listings
```

### Orders
```
POST   /api/orders/                  ← Place order (BUYER only)
GET    /api/orders/my/               ← My orders
PATCH  /api/orders/{id}/status/      ← Accept/Reject (FARMER only)
```

### Alerts
```
POST   /api/alerts/          ← Set price alert (auth required)
GET    /api/alerts/my/       ← My active alerts
DELETE /api/alerts/{id}/     ← Soft delete alert
POST   /api/alerts/test-sms/ ← Send test SMS (ADMIN only)
```

---

## Scraper Logic

- Runs every day at **6:00 AM NPT** via APScheduler
- Fetches prices from **https://kalimatimarket.gov.np/**
- Parses 102 commodities → matches to 66 crops in DB
- Handles Devanagari digits (रू ६०) → Decimal(60)
- Fuzzy Nepali name matching with normalization
- Groups variety-tagged entries (आलु रातो, आलु सेतो → आलु)
- Saves to DailyPrice with update_or_create
- After saving → triggers all active PriceAlert checks
- On failure → sends email to admin via mail_admins()

---

## SMS Alert System (Sparrow SMS)

- Service class: apps/alerts/sms.py
- API: https://api.sparrowsms.com/v2/sms/
- Message format (≤160 chars):
  "किसान बजार: आलु को मूल्य रु.20.00 पुग्यो। आपको alert threshold रु.25.00 थियो।"
- Gracefully skips if token not configured
- Never crashes the scheduler on failure

---

## Frontend Features

- **Language Toggle**: Nepali (default) / English
- **Search Bar**: Real-time filter with transliteration
  - "aalu" → आलु, "potato" → आलु, "pyaj" → प्याज
- **Districts**: All 77 Nepal districts in dropdowns
- **Responsive**: Mobile-first, works on desktop too
- **Bottom Nav**: Mobile only (hidden on desktop md+)
- **Top Navbar**: Desktop only with logo + nav links

---

## Environment Variables (.env)

```bash
DEBUG=True
SECRET_KEY=your-secret-key-here

# Database
DATABASE_URL=postgresql://kisaan_user:kisan123@localhost:5432/kisaan_bazar

# Cache
REDIS_URL=redis://localhost:6379

# SMS
SPARROW_SMS_TOKEN=your-sparrow-token

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# Scraper
KALIMATI_URL=https://kalimatimarket.gov.np/
```

---

## How to Run

```bash
# Backend
cd backend
source venv/bin/activate        # Windows: venv\Scripts\activate
python manage.py runserver      # → http://127.0.0.1:8000

# Frontend
cd FrontEnd
npm run dev                     # → http://localhost:5173

# Scraper (manual run)
cd backend
source venv/bin/activate
python manage.py scrape_prices
python manage.py scrape_prices --dry-run         # Test only, no DB save
python manage.py scrape_prices --show-unmatched  # Show unmatched crops

# Seed all 66 crops
python manage.py seed_crops
python manage.py seed_crops --reset  # Wipe and re-seed

# Run all tests
python manage.py test apps       # 90/90 tests

# Django admin panel
# http://127.0.0.1:8000/admin/
# Login: admin / admin123
```

---

## Development Rules (Always Follow)

1. **Always use apps/ directory** — never put code in root
2. **Nepali field names** where user-facing (name_nepali, etc.)
3. **All prices in NPR (रु.)** — DecimalField(max_digits=8, decimal_places=2)
4. **Every API must be tested** — write tests in tests.py
5. **Never hardcode credentials** — always use .env
6. **Pagination** — all list APIs must have pagination (20 items/page)
7. **Filtering** — price APIs must support ?crop=, ?date=, ?district=
8. **Soft delete** — use is_active=False instead of actual delete
9. **Timestamps** — every model must have created_at, updated_at
10. **App paths** — always use "apps.users" not just "users" in apps.py

---

## Completed Features Checklist

- [x] Django project setup with split settings
- [x] Custom User model with FARMER/BUYER/ADMIN roles
- [x] 6 database models with all relationships
- [x] 25 REST API endpoints
- [x] JWT authentication (register, login, refresh, me)
- [x] Kalimati scraper (102 commodities → 66 crops)
- [x] APScheduler (runs daily at 6AM NPT)
- [x] Sparrow SMS alert system
- [x] React frontend with Vite + Tailwind CSS
- [x] Nepali/English language toggle
- [x] Transliteration search (aalu → आलु)
- [x] All 77 Nepal districts in dropdowns
- [x] Responsive design (mobile + desktop)
- [x] Soft delete everywhere
- [x] Pagination (20 items/page)
- [x] Security hardening (18 vulnerabilities fixed)
- [x] 90/90 tests passing
- [x] JWT blacklist + httpOnly cookies
- [x] Rate limiting on login/register
- [x] Nepal phone + district validation
- [x] Protected routes (role-based)
- [x] File upload validation (type + size)

---

## Phase 2 — Advanced Features (Upcoming)

### Step 9  → React Native mobile app (Android + iOS)
### Step 10 → Price prediction ML model
### Step 11 → eSewa / Khalti payment integration
### Step 12 → Farmer analytics dashboard
### Step 13 → Weather integration (OpenWeatherMap)
### Step 14 → Production deployment (Render / Railway)

---

## Notes for Claude

- This is a **Nepali agricultural project** — keep Nepali context in mind
- Prices are in **NPR (Nepali Rupees)**
- Districts refer to **Nepal's 77 districts**
- SMS provider is **Sparrow SMS** (sparrowsms.com) — Nepal specific
- Kalimati is the **main wholesale vegetable market in Kathmandu**
- Correct Kalimati URL: **https://kalimatimarket.gov.np/**
- Target farmers may have **low technical literacy** — keep it simple
- Django version is **4.2.29** (not 5.x) due to Python 3.9 on Mac
- Virtual environment is inside **backend/venv/**
- Always activate venv before running any python commands