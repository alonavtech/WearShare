from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from .config import get_settings
from .db import Base, engine, is_sqlite
from .routers import ai, bootstrap, borrow, groups, items, messages, users

settings = get_settings()
app = FastAPI(title="WearShare API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

for r in (users.router, items.router, ai.router, groups.router, borrow.router, messages.router, bootstrap.router):
    app.include_router(r)


@app.on_event("startup")
def startup() -> None:
    Base.metadata.create_all(engine)
    if not is_sqlite:
        # Database-level guarantee: approved bookings for the same item can never overlap.
        try:
            with engine.begin() as conn:
                conn.execute(text("CREATE EXTENSION IF NOT EXISTS btree_gist"))
                exists = conn.execute(text("SELECT 1 FROM pg_constraint WHERE conname = 'no_overlapping_approved'")).first()
                if not exists:
                    conn.execute(text("""
                        ALTER TABLE borrow_requests ADD CONSTRAINT no_overlapping_approved
                        EXCLUDE USING gist (item_id WITH =, daterange(start_date, end_date, '[]') WITH &&)
                        WHERE (status = 'approved')"""))
            print("Database: no-overlap booking constraint is active.")
        except Exception as exc:
            print(f"WARNING: could not add the no-overlap constraint ({exc}). "
                  "The approval row-lock and overlap check in the code still protect bookings.")


@app.get("/api/health")
def health():
    return {"ok": True, "ai": bool(settings.groq_api_key), "auth": "dev" if settings.dev_auth else "auth0",
            "db": "sqlite" if is_sqlite else "postgres"}
