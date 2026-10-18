"""Activity events stored in a Tiger Data (TimescaleDB) hypertable.

Why: the README's "Impact Measurement" needs counts over time (items listed, requests, exchanges).
A hypertable splits a table into time-based chunks automatically, so time-range queries stay fast
as data grows. Recording an event must never break a user's action, so every failure is swallowed.
"""
from sqlalchemy import text

from .db import engine, is_sqlite


def setup_events() -> None:
    if is_sqlite:
        return
    try:
        with engine.begin() as conn:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS activity_events (
                    created_at timestamptz NOT NULL DEFAULT now(),
                    kind text NOT NULL,
                    user_id integer,
                    item_id integer)"""))
        with engine.begin() as conn:
            conn.execute(text("SELECT create_hypertable('activity_events', 'created_at', if_not_exists => TRUE)"))
        print("Database: activity_events is a Tiger Data (TimescaleDB) hypertable.")
    except Exception as exc:
        print(f"WARNING: could not make activity_events a hypertable ({exc}). Impact stats still work from the main tables.")


def record(kind: str, user_id: int | None = None, item_id: int | None = None) -> None:
    if is_sqlite:
        return
    try:
        with engine.begin() as conn:
            conn.execute(text("INSERT INTO activity_events (kind, user_id, item_id) VALUES (:k, :u, :i)"),
                         {"k": kind, "u": user_id, "i": item_id})
    except Exception:
        pass  # analytics must never block a real action
