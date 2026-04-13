"""
APScheduler setup for the Kalimati price scraper.
Runs the scraper daily at 6:00 AM NPT (Asia/Kathmandu).
"""
import logging
from typing import Optional
from zoneinfo import ZoneInfo

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

logger = logging.getLogger(__name__)

_scheduler: Optional[BackgroundScheduler] = None
NPT = ZoneInfo("Asia/Kathmandu")


def _scrape_job():
    """Wrapper so APScheduler has a module-level callable to import."""
    from apps.scraper.scraper import run_scraper
    run_scraper()


def start_scheduler() -> None:
    """
    Start the background scheduler and register the daily scrape job.
    Safe to call multiple times — skips if already running.
    """
    global _scheduler

    if _scheduler is not None and _scheduler.running:
        logger.debug("Scheduler already running — skipping start")
        return

    _scheduler = BackgroundScheduler(timezone=NPT)

    _scheduler.add_job(
        _scrape_job,
        trigger=CronTrigger(hour=6, minute=0, timezone=NPT),
        id="kalimati_daily_scrape",
        replace_existing=True,
        misfire_grace_time=3600,    # allow up to 1 h late if server was down
    )

    _scheduler.start()
    logger.info(
        "Scheduler started — Kalimati scrape scheduled daily at 06:00 NPT"
    )


def stop_scheduler() -> None:
    """Gracefully shut down the scheduler (used in tests / shutdown hooks)."""
    global _scheduler
    if _scheduler and _scheduler.running:
        _scheduler.shutdown(wait=False)
        logger.info("Scheduler stopped")
