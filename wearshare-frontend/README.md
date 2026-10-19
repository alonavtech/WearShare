# WearShare Frontend

This static frontend is served with the FastAPI backend on Vercel. It also includes the PWA manifest, service worker, and install icons.

For local development, run FastAPI from `backend` with `uvicorn app.main:app --reload`, then serve this folder with VS Code Live Server or `python -m http.server 5500`. The frontend uses the local API at `http://localhost:8000`.

For deployment setup, environment variables, and mobile installation instructions, see the repository [README](../README.md).
