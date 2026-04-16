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

| Layer          | Technology                                          |
|----------------|-----------------------------------------------------|
| Backend        | Python 3.9 / Django 4.2.29 / Django REST Framework  |
| Database       | PostgreSQL 15+                                      |
| Cache          | Redis                                               |
| Scraper        | Playwright + APScheduler (bypasses bot protection)  |
| SMS            | Sparrow SMS API (Nepal)                             |
| Auth           | JWT (djangorestframework-simplejwt)                 |
| Env            | django-environ                                      |
| Frontend       | React + Vite + Tailwind CSS                         |
| Frontend routing | React Router v7                                   |
| HTTP client    | Axios (central instance at src/api/axios.js)        |
| Bundle         | Vite with lazy-loaded code splitting                |
| Hosting        | Render / Railway (planned)                          |

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
│       ├── listings/             ← Farmer crop listings + saved
│       ├── orders/               ← Buyer order requests
│       ├── alerts/               ← SMS/Email price alerts
│       └── scraper/              ← Kalimati auto price fetcher + ScraperLog
│
└── FrontEnd/                     ← React frontend
    ├── src/
    │   ├── api/
    │   │   └── axios.js             ← Central Axios instance (always import this)
    │   ├── components/
    │   ├── pages/                   ← All lazy-loaded (code splitting)
    │   ├── context/
    │   │   ├── AuthContext.jsx      ← JWT auth, user state
    │   │   └── LanguageContext.jsx  ← Nepali/English toggle
    │   └── utils/
    │       ├── districts.js            ← All 77 Nepal districts
    │       ├── nepalMunicipalities.js  ← 753 municipalities + exact ward counts
    │       └── searchUtils.js          ← Transliteration (aalu → आलु)
    ├── index.html
    └── vite.config.js
```

---

## Database Models

### users/models.py
```python
User (extends AbstractUser)
- role              : CharField  → FARMER | BUYER | ADMIN
- phone             : CharField
- district          : CharField  → One of Nepal's 77 districts
- address           : TextField
- full_name         : CharField
- municipality      : CharField
- ward_number       : IntegerField
- farm_size_ropani  : DecimalField  (FARMER only)
- business_type     : CharField     (BUYER only)
- profile_photo     : ImageField
- id_type           : CharField  → citizenship | nid | passport
- id_number         : CharField
- id_front_photo    : ImageField   (required for FARMER)
- id_back_photo     : ImageField
- is_verified       : BooleanField
- is_id_verified    : BooleanField
- main_crops        : ManyToManyField(Crop)  (FARMER only)
- created_at        : DateTimeField (auto)
- updated_at        : DateTimeField (auto)
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

SavedListing
- buyer      : FK(User)     → Must be BUYER role
- listing    : FK(Listing)
- created_at : DateTimeField (auto)
- unique_together: (buyer, listing)
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

### scraper/models.py
```python
ScraperLog
- status            : CharField  → RUNNING | SUCCESS | ERROR
- triggered_by      : FK(User, null=True)  → null = scheduled run
- fetched_count     : IntegerField
- saved_count       : IntegerField
- unmatched_count   : IntegerField
- error_message     : TextField (blank=True)
- started_at        : DateTimeField (auto_now_add)
- finished_at       : DateTimeField (null=True)
```

---

## API Endpoints

### Auth
```
POST   /api/auth/register/       ← Farmer/Buyer signup (3-step wizard)
POST   /api/auth/login/          ← Returns JWT tokens
POST   /api/auth/refresh/        ← Refresh access token
GET    /api/auth/me/             ← Current user info
PATCH  /api/auth/me/             ← Update profile
POST   /api/auth/logout/         ← Blacklist refresh token
POST   /api/auth/change-password/
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
POST   /api/listings/{id}/save/    ← Save listing (BUYER only)
DELETE /api/listings/{id}/unsave/  ← Unsave listing (BUYER only)
GET    /api/listings/saved/        ← My saved listings (BUYER only)
```

### Orders
```
POST   /api/orders/                  ← Place order (BUYER only)
GET    /api/orders/my/               ← My orders
PATCH  /api/orders/{id}/status/      ← Accept/Reject (FARMER only)
DELETE /api/orders/{id}/             ← Cancel order (BUYER only)
```

### Alerts
```
POST   /api/alerts/          ← Set price alert (auth required)
GET    /api/alerts/my/       ← My active alerts
DELETE /api/alerts/{id}/     ← Soft delete alert
POST   /api/alerts/test-sms/ ← Send test SMS (ADMIN only)
```

### Admin (ADMIN role only)
```
GET    /api/admin/stats/             ← Dashboard stats
GET    /api/admin/users/             ← All users (role + search filter)
PATCH  /api/admin/users/{id}/verify/ ← Toggle is_verified
GET    /api/admin/listings/          ← All listings (is_active filter)
DELETE /api/admin/listings/{id}/     ← Hard delete
GET    /api/admin/orders/            ← All orders (status filter)
GET    /api/admin/prices/            ← All prices (date filter)
POST   /api/admin/prices/            ← Manual price entry
POST   /api/admin/scraper/run/       ← Trigger scrape (max 3/day)
GET    /api/admin/scraper/logs/      ← Last scraper runs
```

---

## Scraper Logic

- Runs every day at **6:00 AM NPT** via APScheduler
- Uses **Playwright** (headless Chromium) to bypass Imunify360 bot protection
- Fetches prices from **https://kalimatimarket.gov.np/**
- Parses 102 commodities → matches to 66 crops in DB
- Handles Devanagari digits (रू ६०) → Decimal(60)
- Fuzzy Nepali name matching with normalization
- Groups variety-tagged entries (आलु रातो, आलु सेतो → आलु)
- Saves to DailyPrice with update_or_create
- After saving → triggers all active PriceAlert checks
- On failure → sends email to admin via mail_admins()
- Every run (scheduled or manual) creates a **ScraperLog** entry
- Manual runs limited to **3 per day** via admin panel

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

- **Language Toggle**: Nepali (default) / English — all text via t() from LanguageContext
- **Search Bar**: Real-time filter with transliteration
  - "aalu" → आलु, "potato" → आलु, "pyaj" → प्याज
- **Districts**: All 77 Nepal districts in dropdowns
- **Municipalities**: 753 Nepal municipalities with exact ward counts
- **Responsive**: Mobile-first, works on desktop too
- **Bottom Nav**: Mobile only (hidden on desktop md+)
- **Top Navbar**: Desktop only with logo + nav links + role-based dashboard link
- **Code splitting**: All pages lazy-loaded (separate JS chunks)
- **Admin Panel**: 6-tab web dashboard (Overview, Users, Listings, Orders, Prices, Scraper)
- **Farmer Dashboard**: Manage listings, view orders, set price alerts, edit profile
- **Buyer Dashboard**: Browse orders, saved listings, price overview, edit profile
- **3-step registration**: Basic info → Location + ID upload → Crops (FARMER) / Business (BUYER)

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
python manage.py migrate
python manage.py runserver      # → http://127.0.0.1:8000

# Frontend
cd FrontEnd
npm install
npm run dev                     # → http://localhost:5173

# Scraper setup (first time / new machine)
pip install playwright
playwright install chromium
python manage.py scrape_prices
python manage.py scrape_prices --dry-run         # Test only, no DB save
python manage.py scrape_prices --show-unmatched  # Show unmatched crops

# Seed all 66 crops
python manage.py seed_crops
python manage.py seed_crops --reset  # Wipe and re-seed

# Run all tests
python manage.py test apps       # 121/121 tests

# Django admin panel (superuser interface)
# http://127.0.0.1:8000/admin/
# Login: admin / admin123
```

### Default accounts

| Role   | Username | Password | URL                                    |
|--------|----------|----------|----------------------------------------|
| ADMIN  | admin    | admin123 | http://localhost:5173/login            |

### App URLs (after login)

```
http://localhost:5173/admin-panel       ← ADMIN only (web admin panel)
http://localhost:5173/dashboard         ← FARMER only
http://localhost:5173/buyer-dashboard   ← BUYER only
http://localhost:5173/prices            ← Public
http://localhost:5173/listings          ← Public
```

### Municipality data

All 753 Nepal municipalities with exact ward counts are pre-loaded in:
`FrontEnd/src/utils/nepalMunicipalities.js`
No seeding needed — static file bundled with the frontend.

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
11. **No emoji in UI** — SVG icons only in navbar, buttons, headings, dashboards,
    forms. Emoji ONLY in crop price cards and listing cards (crop.emoji field).
12. **All UI text via t()** — never hardcode Nepali or English strings.
    Always use t('key') from useLanguage(). Add keys to both `ne` and `en`
    blocks in FrontEnd/src/i18n/translations.js.
13. **Always use central API instance** — import api from 'src/api/axios.js'.
    Never import raw axios directly in page/component files.
    Token attachment and 401 auto-refresh are handled automatically.
14. **Role-based navigation after login**:
    - ADMIN  → /admin-panel
    - FARMER → /dashboard
    - BUYER  → /buyer-dashboard
    Use the user object returned by login() to determine the redirect.

---

## Completed Features Checklist

- [x] Django project setup with split settings
- [x] Custom User model with FARMER/BUYER/ADMIN roles
- [x] Extended User model (full_name, municipality, ward, ID photos, main_crops)
- [x] 25+ REST API endpoints
- [x] JWT authentication (register, login, refresh, me, logout, change-password)
- [x] 3-step wizard registration (basic → location/ID → crops/business)
- [x] ID verification upload (id_front_photo required for FARMER)
- [x] Kalimati scraper — Playwright (bypasses Imunify360 bot protection)
- [x] APScheduler (runs daily at 6AM NPT)
- [x] ScraperLog model (tracks status, counts, triggered_by, duration)
- [x] Admin panel — web-based, 6 tabs (Overview, Users, Listings, Orders, Prices, Scraper)
- [x] Admin endpoints (/api/admin/*) — IsAdmin permission
- [x] Scraper daily limit (max 3 manual runs/day) enforced in backend
- [x] Sparrow SMS alert system
- [x] SavedListing model + save/unsave API (BUYER only)
- [x] Buyer Dashboard (4 tabs: Overview, Orders, Saved Listings, Profile)
- [x] Farmer Dashboard (Listings, Orders, Alerts, Profile tabs)
- [x] React frontend with Vite + Tailwind CSS
- [x] Nepali/English language toggle (all text via LanguageContext t())
- [x] Transliteration search (aalu → आलु)
- [x] All 77 Nepal districts in dropdowns
- [x] 753 Nepal municipalities + exact ward counts (nepalMunicipalities.js)
- [x] Municipality + Ward dropdowns in registration form
- [x] Responsive design (mobile + desktop)
- [x] Code splitting — all pages lazy-loaded (separate JS chunks, 0 warnings)
- [x] Central Axios instance (src/api/axios.js) with in-memory token + auto-refresh
- [x] AbortController on all useEffect API calls (no memory leaks on unmount)
- [x] Soft delete everywhere
- [x] Pagination (20 items/page)
- [x] Security hardening (18 vulnerabilities fixed)
- [x] 121/121 tests passing
- [x] JWT blacklist + httpOnly cookies
- [x] Rate limiting on login/register
- [x] Nepal phone + district validation
- [x] Protected routes (role-based)
- [x] File upload validation (type + size)
- [x] Role-based post-login redirect (ADMIN→/admin-panel, FARMER→/dashboard, BUYER→/buyer-dashboard)

---

## Phase 2 — Advanced Features (Upcoming)

### Step 9  → React Native mobile app (Android + iOS)
### Step 10 → Price prediction ML model
### Step 11 → eSewa / Khalti payment integration
### Step 12 → Price history chart (30-day line graph per crop)
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
- The scraper uses **Playwright** (not requests/BeautifulSoup) because
  kalimatimarket.gov.np uses Imunify360 which blocks plain HTTP clients
- Admin panel at **/admin-panel** (frontend) is separate from Django's
  /admin/ (superuser interface) — both exist and serve different purposes
