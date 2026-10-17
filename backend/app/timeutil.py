from datetime import date, datetime, time, timedelta
from zoneinfo import ZoneInfo

from .config import get_settings

TZ = ZoneInfo(get_settings().app_timezone)


def now() -> datetime:
    return datetime.now(TZ)


def today() -> date:
    return now().date()


def earliest_start(current: datetime | None = None) -> date:
    """Requests must be made at least 24 hours before the start of the first borrowed day."""
    cutoff = (current or now()) + timedelta(hours=24)
    d = cutoff.date()
    if datetime.combine(d, time.min, TZ) < cutoff:
        d += timedelta(days=1)
    return d
