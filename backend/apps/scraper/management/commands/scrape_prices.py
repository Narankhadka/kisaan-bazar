"""
Management command: python manage.py scrape_prices

Manually trigger the Kalimati market price scraper.
Useful for testing, backfills, or running outside the scheduled window.
"""
from django.core.management.base import BaseCommand
from django.utils import timezone


class Command(BaseCommand):
    help = "Scrape today's prices from Kalimati market and save to DailyPrice"

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Fetch and parse prices without saving to the database",
        )
        parser.add_argument(
            "--show-unmatched",
            action="store_true",
            help="Print all commodity names that could not be matched to a Crop",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        show_unmatched = options["show_unmatched"]

        self.stdout.write(
            self.style.MIGRATE_HEADING(
                f"\nKalimati Market Scraper — {timezone.localdate()}\n"
                f"{'[DRY RUN] ' if dry_run else ''}"
                "Fetching prices...\n"
            )
        )

        from apps.scraper.scraper import fetch_raw_prices, save_prices
        from apps.scraper.alert_checker import check_price_alerts

        # --- Fetch & parse ---
        try:
            raw_rows = fetch_raw_prices()
        except Exception as exc:
            self.stderr.write(self.style.ERROR(f"Fetch failed: {exc}"))
            return

        self.stdout.write(
            self.style.SUCCESS(f"  Fetched {len(raw_rows)} commodities from Kalimati")
        )

        if dry_run:
            self.stdout.write("\n--- Parsed prices (not saved) ---")
            for r in raw_rows:
                self.stdout.write(
                    f"  {r['name']:<35} min={r['min_price']:>8}  "
                    f"max={r['max_price']:>8}  unit={r['unit']}"
                )
            self.stdout.write(self.style.WARNING("\nDry run — nothing saved."))
            return

        # --- Save ---
        try:
            saved, unmatched = save_prices(raw_rows)
        except Exception as exc:
            self.stderr.write(self.style.ERROR(f"Save failed: {exc}"))
            return

        self.stdout.write(
            self.style.SUCCESS(f"  Saved/updated {saved} crop prices in DailyPrice")
        )

        if unmatched:
            self.stdout.write(
                self.style.WARNING(
                    f"  {len(unmatched)} commodities unmatched "
                    f"(no Crop record found)"
                )
            )
            if show_unmatched:
                self.stdout.write("--- Unmatched commodities ---")
                for name in unmatched:
                    self.stdout.write(f"  • {name}")

        # --- Alerts ---
        try:
            triggered = check_price_alerts()
            if triggered:
                self.stdout.write(
                    self.style.SUCCESS(f"  {triggered} price alert(s) triggered")
                )
            else:
                self.stdout.write("  No price alerts triggered")
        except Exception as exc:
            self.stderr.write(self.style.WARNING(f"Alert check failed: {exc}"))

        self.stdout.write(self.style.SUCCESS("\nDone.\n"))
