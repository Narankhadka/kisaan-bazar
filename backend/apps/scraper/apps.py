import os
import sys

from django.apps import AppConfig


class ScraperConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.scraper"
    verbose_name = "Kalimati Scraper"

    def ready(self):
        # Skip during migrations, shell, tests, or any non-server command.
        _server_commands = {"runserver", "gunicorn", "uvicorn", "daphne"}
        if not any(cmd in sys.argv for cmd in _server_commands):
            return

        # With Django's auto-reloader, ready() is called in both the parent
        # process and the reloaded child. RUN_MAIN=true is only set in the
        # child (actual server), so we start the scheduler there only.
        if "runserver" in sys.argv and os.environ.get("RUN_MAIN") != "true":
            return

        from apps.scraper.scheduler import start_scheduler
        start_scheduler()
