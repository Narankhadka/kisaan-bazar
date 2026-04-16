from django.db import models
from django.conf import settings


class ScraperLog(models.Model):
    class Status(models.TextChoices):
        RUNNING = 'RUNNING', 'Running'
        SUCCESS = 'SUCCESS', 'Success'
        ERROR   = 'ERROR',   'Error'

    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.RUNNING,
    )
    triggered_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='scraper_runs',
    )
    fetched_count   = models.IntegerField(default=0)
    saved_count     = models.IntegerField(default=0)
    unmatched_count = models.IntegerField(default=0)
    error_message   = models.TextField(blank=True)
    started_at      = models.DateTimeField(auto_now_add=True)
    finished_at     = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-started_at']

    def __str__(self):
        return f"ScraperLog {self.pk} [{self.status}] {self.started_at:%Y-%m-%d %H:%M}"
