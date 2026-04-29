# Kisaan Bazar (किसान बजार)

> A direct farmer-to-buyer marketplace for Nepal, with daily wholesale price intelligence

A full-stack web platform that connects Nepali farmers directly with buyers, removing middlemen, and surfaces daily wholesale vegetable and fruit prices scraped from Kalimati Market (Nepal's largest agricultural wholesale market) so farmers can price their produce fairly.

> Final-year academic / portfolio project by [Naran Khadka](#author). Built as a learning exercise in Django REST, React, web scraping under bot protection, role-based authentication, and bilingual UX.

---

 
## Demo / Screenshots
 
_Screenshots will be added here. The app currently runs locally only._
 
| Home (Nepali) | Daily Prices | Listings |
|---------------|--------------|----------|
| _placeholder_ | _placeholder_ | _placeholder_ |
 
| Farmer Dashboard | Admin Panel | Phone OTP |
|------------------|-------------|-----------|
| _placeholder_ | _placeholder_ | _placeholder_ |

---

## Key Features

### Farmer
- Multi-step registration capturing district, municipality, ward, farm size, business type, and main crops
- ID verification flow (upload front and back images, admin reviews and approves before login is enabled)
- Phone OTP verification via Sparrow SMS
- Create, update, and soft-delete crop listings with photos and asking prices
- Farmer dashboard with own listings, incoming orders, and order status flow
- Price alerts: get notified via SMS or email when a crop crosses an above or below threshold

### Buyer
- Browse listings filtered by crop, district, and availability
- Save favorite listings
- Place orders against listings with quantity and message
- Buyer dashboard with order history and status tracking
- Payment success and failure callback pages (eSewa flow scaffolded; see Roadmap)

### Admin
- Custom admin panel for verifying farmer ID submissions
- Trigger Kalimati price scraper manually
- Receive email alerts when scheduled scraper runs fail
- Standard Django admin for all other models

---

## Technical Highlights

- **Kalimati price scraper with Devanagari text normalization**. Uses Playwright (headless Chromium) to bypass Imunify360 JavaScript bot protection on the Kalimati Market site. Normalizes Devanagari digits, strips anusvara, and handles virama variants for fuzzy crop name matching, then aggregates multiple scraped variants into one canonical record per crop per day.
- **Secure JWT authentication pattern**. Access token kept in JS memory (never localStorage), refresh token stored in an httpOnly cookie. Refresh-token rotation and blacklisting via `djangorestframework-simplejwt`. Login is rate-limited to 5 attempts per IP per 15 minutes via `django-ratelimit`.
- **Role-based access control**. Three roles (`FARMER`, `BUYER`, `ADMIN`) with route-level permissions. Farmers cannot log in until an admin verifies their submitted ID images.
- **Bilingual i18n**. Custom `LanguageContext` with Nepali as default and English as fallback. All UI strings, crop names, and error messages translated.
- **Working SMS OTP integration**. Real SMS messages sent via Sparrow SMS API for phone verification and price alerts.
- **Scheduled scraping**. APScheduler runs the scraper on a schedule; results trigger price alert checks against user-defined thresholds.
- **Production-shaped Django setup**. PostgreSQL via `DATABASE_URL`, Redis caching via `django-redis`, split settings (`base` / `development` / `production`), and `django-environ` for config.

---

## Tech Stack

| Layer | Technologies |
|-------|--------------|
| **Backend** | Python, Django 5.0, Django REST Framework 3.15, djangorestframework-simplejwt, django-ratelimit, django-cors-headers, django-redis, django-environ, Pillow, BeautifulSoup4, Playwright (Chromium), APScheduler |
| **Frontend** | React 19, Vite 8, React Router DOM 7 (lazy-loaded routes), Tailwind CSS 4, Axios, Recharts, custom LanguageContext for i18n |
| **Database** | PostgreSQL (primary), Redis (cache + rate limit store) |
| **Integrations** | Sparrow SMS API (OTP and price alerts), eSewa payment gateway (sandbox, in progress) |
| **Tooling** | ESLint 9, psycopg2-binary, virtualenv |

---

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 20+ and npm
- PostgreSQL 14+
- Redis 6+
- Playwright with Chromium (installed in a separate step below)

### 1. Clone

```bash
git clone https://github.com/Narankhadka/kisaan-bazar.git
cd kisaan-bazar
```

### 2. Backend setup

```bash
cd backend
python -m venv venv
source venv/bin/activate           # on Windows: venv\Scripts\activate
pip install -r requirements.txt
playwright install chromium
cp .env.example .env               # then fill in real values
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

The API runs at `http://localhost:8000`.

### 3. Frontend setup

In a new terminal:

```bash
cd frontend
cp .env.example .env               # then fill in real values
npm install
npm run dev
```

The app runs at `http://localhost:5173`.

### Environment variables

See `backend/.env.example` and `frontend/.env.example` for the full list with placeholder values. At minimum you need:

**Backend**
- `SECRET_KEY` (Django secret, generate a long random string)
- `DEBUG` (`True` for dev)
- `DATABASE_URL` (PostgreSQL connection string)
- `REDIS_URL` (Redis connection string)
- `SPARROW_SMS_TOKEN` (for OTP sending)
- `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD` (for password reset and admin alerts)
- `ESEWA_PRODUCT_CODE`, `ESEWA_SECRET_KEY` (sandbox defaults provided)

**Frontend**
- `VITE_API_BASE_URL` (e.g. `http://localhost:8000/api`)

---

## Project Structure

```
kisaan-bazar/
├── backend/                          Django REST API
│   ├── apps/
│   │   ├── users/                    Custom User model, registration, JWT auth, OTP, ID verification
│   │   ├── crops/                    Crop catalog (Nepali + English names, units, categories)
│   │   ├── prices/                   Daily wholesale prices (min, max, auto-calculated avg)
│   │   ├── scraper/                  Playwright-based Kalimati scraper, scheduler, admin panel API
│   │   ├── listings/                 Farmer crop listings, soft delete, saved favorites
│   │   ├── orders/                   Buyer orders, status flow, eSewa payment fields
│   │   └── alerts/                   Price alerts (above/below thresholds, SMS + email delivery)
│   ├── config/                       Split settings (base / dev / prod), URL routing
│   ├── manage.py
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/                         React + Vite SPA
│   ├── src/
│   │   ├── pages/                    15 lazy-loaded routes (Home, Prices, Listings, Login,
│   │   │                             Register, Verify Phone, Dashboards, Admin Panel, etc.)
│   │   ├── components/               BottomNav, TopNav, ListingCard, PriceCard, OrderModal,
│   │   │                             PriceHistoryChart, Spinner, Footer
│   │   ├── context/                  AuthContext (JWT memory + refresh cookie),
│   │   │                             LanguageContext (Nepali / English)
│   │   ├── api/                      Axios instance with refresh interceptor
│   │   ├── i18n/                     Translation strings
│   │   └── data/                     Districts, municipalities
│   ├── package.json
│   ├── vite.config.js
│   └── .env.example
│
└── README.md
```

---

## Roadmap

- [ ] **Complete eSewa payment integration**. UI and order schema are scaffolded; the backend payment-init and verify endpoints still need to be wired to real eSewa sandbox calls.
- [ ] **Automated tests**. Currently only Django default test stubs exist. Plan to add unit tests for serializers, integration tests for views, and component tests for the React frontend.
- [ ] **Dockerize**. Add `Dockerfile` for backend (with Playwright base image), multi-stage build for frontend, and a `docker-compose.yml` that brings up Django, frontend, PostgreSQL, and Redis together.
- [ ] **CI/CD**. GitHub Actions workflow to run `pytest`, `npm run lint`, and `npm run build` on every PR.
- [ ] **Deploy to a live server**. Currently runs locally only.
- [ ] **Move uploaded images to object storage** (S3 or Cloudinary) instead of the local filesystem.
- [ ] **Harden the scraper** further. Imunify360 updates occasionally break the bypass; add better retry logic and a fallback static price source.

---

## Known Issues / Limitations

- **Scraper is fragile.** The Imunify360 JS challenge changes occasionally and breaks the Playwright bypass. When it fails, an admin can re-trigger the scraper manually from the admin panel and email alerts are sent on scheduled-run failures.
- **eSewa payment is UI-only.** The order model has fields for `esewa_transaction_id`, `ref_id`, etc., and the frontend has success and failure callback pages, but the actual payment-init and verify backend logic is not yet implemented.
- **No automated tests yet** beyond Django's default `tests.py` stubs.
- **Not deployed.** The app currently runs on localhost only.
- **No Dockerfile or container orchestration yet.**
- **No CI/CD pipeline yet.**
- **Image uploads are stored on the local filesystem** under `media/`. Production deployment would need object storage.

---

## License

This project is released under the [MIT License](LICENSE).

---

## Author

**Naran Khadka**

- GitHub: [@Narankhadka](https://github.com/Narankhadka)
- LinkedIn: [in/naran-khadka-0b331b217](https://linkedin.com/in/naran-khadka-0b331b217)
- Portfolio: [narankhadka.com.np](https://www.narankhadka.com.np/)

If you are a recruiter or hiring manager, I am happy to walk through the scraper architecture, the JWT refresh-cookie auth pattern, or the role-based access design in a screen-share. Reach out via LinkedIn.
