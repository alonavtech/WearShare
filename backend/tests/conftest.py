import os
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
os.environ["DATABASE_URL"] = f"sqlite:///{ROOT / 'test.db'}"
os.environ["AUTH0_DOMAIN"] = ""
os.environ["AUTH0_AUDIENCE"] = ""
os.environ["GROQ_API_KEY"] = ""
os.environ["UPLOAD_DIR"] = str(ROOT / "test_uploads")


@pytest.fixture()
def client():
    from fastapi.testclient import TestClient
    from app.db import Base, engine
    from app.main import app
    Base.metadata.drop_all(engine)
    with TestClient(app) as c:
        yield c
    Base.metadata.drop_all(engine)


def as_user(client, name):
    class Caller:
        def __getattr__(self, method):
            def call(url, **kw):
                kw.setdefault("headers", {})["X-Dev-User"] = name
                return getattr(client, method)(url, **kw)
            return call
    return Caller()
