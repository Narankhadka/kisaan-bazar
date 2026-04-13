"""
Kalimati Market Price Scraper
Fetches daily vegetable/fruit prices from kalimatimarket.gov.np
and saves them to the DailyPrice model.
"""
import logging
import re
from decimal import Decimal, InvalidOperation

import requests
from bs4 import BeautifulSoup
from django.conf import settings
from django.core.mail import mail_admins
from django.utils import timezone

logger = logging.getLogger(__name__)

# Devanagari digit -> ASCII digit translation table
_DEVANAGARI = str.maketrans("०१२३४५६७८९", "0123456789")

# Normalise common Nepali spelling variants so matching is more robust.
# e.g. "गोलभेडा" (site) matches "गोलभेंडा" (DB) after anusvara is removed.
_NORMALIZE_STRIP = re.compile(r"[ंँॅॉ]")

# ु् (vowel-sign-u + virama) is a typographic variant common on this site.
# "खु्र्सानी" and "खुर्सानी" are the same word — normalise by dropping the
# virama when it immediately follows ु.
_VOWEL_VIRAMA = re.compile("\u0941\u094D")  # ु + ्


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _to_decimal(text: str):
    """Convert a Nepali price string 'रू ६५.००' -> Decimal('65.00')."""
    text = text.translate(_DEVANAGARI)
    text = re.sub(r"र[ूु]\s*", "", text).strip()
    try:
        return Decimal(text)
    except InvalidOperation:
        return None


def _normalize(text: str) -> str:
    """
    Normalise a Nepali commodity string for fuzzy matching:
    - Remove anusvara / chandrabindu variants (ं ँ)
    - Remove ु् (virama after u vowel) — a site-specific spelling variant
    - Collapse punctuation to spaces
    - Lowercase
    """
    text = _VOWEL_VIRAMA.sub("\u0941", text)   # खु्र् → खुर्
    text = _NORMALIZE_STRIP.sub("", text)
    text = re.sub(r"[\(\)\.\,\-]", " ", text)
    return text.lower().strip()


def _best_crop_match(scraped_name: str, crops):
    """
    Return the best-matching Crop for a scraped commodity name.

    Matching rule: crop.name_nepali (normalised) must be a substring of the
    scraped name (normalised).  Crops are tried longest-name-first so that
    a specific entry like "ब्रोकाउली" wins over the shorter "काउली" when the
    scraped name is "ब्रोकाउली".

    Returns None when no Crop matches.
    """
    norm_scraped = _normalize(scraped_name)
    for crop in sorted(crops, key=lambda c: len(c.name_nepali), reverse=True):
        norm_crop = _normalize(crop.name_nepali)
        if norm_crop and norm_crop in norm_scraped:
            return crop
    return None


# ---------------------------------------------------------------------------
# Fetch & parse
# ---------------------------------------------------------------------------

def fetch_raw_prices():
    """
    Download the Kalimati homepage and parse the price table.

    Table id: commodityDailyPrice
    Columns:  कृषि उपज | न्यूनतम | अधिकतम | औसत

    Returns list of dicts: {name, unit, min_price, max_price}.
    Raises requests.RequestException or ValueError on failure.
    """
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0.0.0 Safari/537.36"
        )
    }
    response = requests.get(settings.KALIMATI_URL, headers=headers, timeout=30)
    response.raise_for_status()

    soup = BeautifulSoup(response.content, "html.parser")
    table = soup.find("table", {"id": "commodityDailyPrice"})
    if not table:
        raise ValueError(
            "Price table (id=commodityDailyPrice) not found on page — "
            "site layout may have changed."
        )

    rows = []
    for tr in table.find("tbody").find_all("tr"):
        tds = tr.find_all("td")
        if len(tds) < 3:
            continue

        # First cell: commodity name + unit inside <span class="text-muted">
        name_td = tds[0]
        unit_span = name_td.find("span", class_="text-muted")
        unit = ""
        if unit_span:
            # "(के.जी.)" -> "के.जी."
            unit = unit_span.get_text(strip=True).strip("()")
            unit_span.decompose()   # remove before reading name
        name = name_td.get_text(strip=True)

        min_price = _to_decimal(tds[1].get_text(strip=True))
        max_price = _to_decimal(tds[2].get_text(strip=True))

        if min_price is None or max_price is None:
            logger.warning("Skipping row with unparseable price: '%s'", name)
            continue

        rows.append({
            "name": name,
            "unit": unit,
            "min_price": min_price,
            "max_price": max_price,
        })

    logger.info("Fetched %d raw price rows from Kalimati", len(rows))
    return rows


# ---------------------------------------------------------------------------
# Match & save
# ---------------------------------------------------------------------------

def save_prices(raw_rows):
    """
    Match scraped rows to active Crop records and upsert into DailyPrice.

    Multiple scraped variants that map to the same Crop (e.g. "आलु रातो" and
    "आलु रातो(भारतीय)" both match "आलु") are aggregated: we take the
    min of all min_prices and max of all max_prices so the record covers the
    full market range for that crop.

    Returns (saved_count, unmatched_names_list).
    """
    from apps.crops.models import Crop
    from apps.prices.models import DailyPrice

    today = timezone.localdate()
    crops = list(Crop.objects.filter(is_active=True))

    # Group rows by matching crop pk
    crop_rows: dict = {}    # crop_pk -> [row, ...]
    unmatched: list = []

    for row in raw_rows:
        crop = _best_crop_match(row["name"], crops)
        if crop is None:
            unmatched.append(row["name"])
            continue
        crop_rows.setdefault(crop.pk, []).append(row)

    crop_by_pk = {c.pk: c for c in crops}
    saved = 0

    for crop_pk, rows in crop_rows.items():
        crop = crop_by_pk[crop_pk]
        agg_min = min(r["min_price"] for r in rows)
        agg_max = max(r["max_price"] for r in rows)

        _, created = DailyPrice.objects.update_or_create(
            crop=crop,
            date=today,
            defaults={
                "min_price": agg_min,
                "max_price": agg_max,
                "source": DailyPrice.Source.KALIMATI,
            },
        )
        action = "Created" if created else "Updated"
        logger.info(
            "%s price for %s: रू %s–%s",
            action, crop.name_nepali, agg_min, agg_max,
        )
        saved += 1

    if unmatched:
        logger.debug(
            "%d unmatched commodities (add them as Crop records to track): %s",
            len(unmatched),
            ", ".join(unmatched[:15]),
        )

    return saved, unmatched


# ---------------------------------------------------------------------------
# Top-level pipeline
# ---------------------------------------------------------------------------

def run_scraper() -> dict:
    """
    Full pipeline: fetch -> parse -> save -> check alerts -> notify on error.
    Returns a result dict. Safe to call from scheduler or management command.
    """
    from apps.scraper.alert_checker import check_price_alerts

    logger.info("Kalimati scrape started (%s)", timezone.localdate())

    try:
        raw_rows = fetch_raw_prices()
        saved, unmatched = save_prices(raw_rows)
        triggered = check_price_alerts()

        result = {
            "status": "ok",
            "date": str(timezone.localdate()),
            "fetched": len(raw_rows),
            "saved": saved,
            "unmatched_count": len(unmatched),
            "alerts_triggered": triggered,
        }
        logger.info(
            "Scrape complete — fetched=%d saved=%d unmatched=%d alerts=%d",
            len(raw_rows), saved, len(unmatched), triggered,
        )
        return result

    except Exception as exc:
        logger.exception("Kalimati scraper failed: %s", exc)
        _notify_admin_failure(exc)
        return {"status": "error", "error": str(exc)}


def _notify_admin_failure(exc: Exception) -> None:
    """Send email to Django ADMINS when scraping fails."""
    try:
        mail_admins(
            subject="[किसान बजार] Kalimati scraper failed",
            message=(
                f"The daily Kalimati price scraper failed on {timezone.localdate()}.\n\n"
                f"Error: {exc}\n\n"
                f"Check server logs for the full traceback.\n"
                f"Today's prices may be missing."
            ),
            fail_silently=True,
        )
    except Exception:
        logger.exception("Failed to send admin failure email")
