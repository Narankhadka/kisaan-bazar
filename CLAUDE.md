# CLAUDE.md — किसान बजार (Agricultural Market Price Portal)

## Project Overview
A web portal that shows daily vegetable/fruit market prices from Kalimati Market (Nepal),
allows farmers to list their crops, and enables buyers to contact farmers directly.

**Goal:** Remove middlemen, give farmers fair market price access.
**Target Users:** Farmers (किसान), Buyers (खरिदकर्ता), Admins

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.11+ / Django 5.x / Django REST Framework |
| Database | PostgreSQL 15+ |
| Cache | Redis |
| Scraper | BeautifulSoup4 + Requests + APScheduler |
| SMS | Sparrow SMS API (Nepal) |
| Auth | JWT (djangorestframework-simplejwt) |
| Frontend (later) | React + Tailwind CSS |
| Hosting (later) | Render / Railway |

---

## Project Structure

```
kisaan-bazar/
├── CLAUDE.md                  ← You are here
├── README.md
├── .env                       ← Never commit this
├── .env.example
├── requirements.txt
├── manage.py
│
├── config/                    ← Django project settings
│   ├── __init__.py
│   ├── settings/
│   │   ├── base.py
│   │   ├── development.py
│   │   └── production.py
│   ├── urls.py
│   └── wsgi.py
│
├── apps/
│   ├── users/                 ← Farmer & Buyer accounts
│   ├── crops/                 ← Crop master list
│   ├── prices/                ← Daily Kalimati price data
│   ├── listings/              ← Farmer crop listings
│   ├── orders/                ← Buyer order requests
│   ├── alerts/                ← SMS/Email price alerts
│   └── scraper/               ← Kalimati auto price fetcher
│
└── frontend/                  ← React app (Phase 2)
```

---

## Database Models (Summary)

### users/models.py
```
User (extends AbstractUser)
- role: FARMER | BUYER | ADMIN
- phone: CharField
- district: CharField
- address: TextField
- is_verified: BooleanField
```

### crops/models.py
```
Crop
- name_nepali: CharField        (आलु)
- name_english: CharField       (Potato)
- unit: CharField               (kg / piece / dozen)
- category: VEGETABLE | FRUIT | OTHER
- emoji: CharField              (🥔)
```

### prices/models.py
```
DailyPrice
- crop: FK(Crop)
- date: DateField
- min_price: DecimalField
- max_price: DecimalField
- avg_price: DecimalField       (auto-calculated)
- source: KALIMATI | MANUAL
- created_at: DateTimeField
```

### listings/models.py
```
Listing
- farmer: FK(User)
- crop: FK(Crop)
- quantity_kg: DecimalField
- asking_price: DecimalField
- description: TextField
- district: CharField
- is_available: BooleanField
- photo: ImageField
- created_at: DateTimeField
```

### orders/models.py
```
Order
- buyer: FK(User)
- listing: FK(Listing)
- quantity_kg: DecimalField
- status: PENDING | ACCEPTED | REJECTED | COMPLETED
- message: TextField
- created_at: DateTimeField
```

### alerts/models.py
```
PriceAlert
- user: FK(User)
- crop: FK(Crop)
- threshold_price: DecimalField
- condition: ABOVE | BELOW
- via_sms: BooleanField
- via_email: BooleanField
- is_active: BooleanField
```

---

## API Endpoints (Planned)

### Auth
```
POST   /api/auth/register/         ← Farmer/Buyer signup
POST   /api/auth/login/            ← JWT token
POST   /api/auth/refresh/          ← Token refresh
```

### Prices
```
GET    /api/prices/today/          ← All today's prices (public)
GET    /api/prices/today/?crop=आलु ← Filter by crop
GET    /api/prices/history/{crop}/ ← 30-day price history
GET    /api/prices/trending/       ← Top movers today
```

### Crops
```
GET    /api/crops/                 ← All crops list
GET    /api/crops/{id}/            ← Single crop detail
```

### Listings (Farmer)
```
GET    /api/listings/              ← All active listings (public)
POST   /api/listings/              ← Create listing (farmer only)
PUT    /api/listings/{id}/         ← Edit listing
DELETE /api/listings/{id}/         ← Remove listing
GET    /api/listings/my/           ← My listings
```

### Orders (Buyer)
```
POST   /api/orders/                ← Place order
GET    /api/orders/my/             ← My orders
PATCH  /api/orders/{id}/status/    ← Accept/Reject (farmer)
```

### Alerts
```
POST   /api/alerts/                ← Set price alert
GET    /api/alerts/my/             ← My alerts
DELETE /api/alerts/{id}/           ← Remove alert
```

---

## Scraper Logic

- Runs every day at **6:00 AM NPT** via APScheduler
- Fetches prices from kalimatimarket.com.np
- Saves to DailyPrice model
- Triggers PriceAlert checks after saving
- If scraping fails → Admin gets email notification

---

## Environment Variables (.env)

```
DEBUG=True
SECRET_KEY=your-secret-key-here
DATABASE_URL=postgresql://user:pass@localhost:5432/kisaan_bazar
REDIS_URL=redis://localhost:6379
SPARROW_SMS_TOKEN=your-sparrow-token
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
KALIMATI_URL=https://www.kalimatimarket.com.np
```

---

## Development Rules (Claude must follow)

1. **Always use apps/ directory** — never put code in root
2. **Nepali field names** where user-facing (name_nepali, etc.)
3. **All prices in NPR (रु.)** — DecimalField(max_digits=8, decimal_places=2)
4. **Every API must be tested** — write tests in tests.py
5. **Never hardcode credentials** — always use .env
6. **Pagination** — all list APIs must have pagination (20 items/page)
7. **Filtering** — price APIs must support ?crop=, ?date=, ?district=
8. **Soft delete** — use is_active=False instead of actual delete
9. **Timestamps** — every model must have created_at, updated_at

---

## Current Phase: Phase 1 — Backend Setup

### Step 1 ✅ CLAUDE.md created
### Step 2 → Django project setup + folder structure
### Step 3 → Database models
### Step 4 → REST API endpoints
### Step 5 → Kalimati scraper
### Step 6 → SMS alert system
### Step 7 → Testing
### Step 8 → Frontend (React)

---

## Notes for Claude

- This is a **Nepali agricultural project** — keep Nepali context in mind
- Prices are in **NPR (Nepali Rupees)**
- Districts refer to **Nepal's 77 districts**
- SMS provider is **Sparrow SMS** (sparrowsms.com) — Nepal-specific
- Kalimati is the **main wholesale vegetable market in Kathmandu**
- Target farmers may have **low technical literacy** — keep it simple
