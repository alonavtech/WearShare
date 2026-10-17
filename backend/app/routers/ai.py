from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.concurrency import run_in_threadpool

from ..ai import AIUnavailable, describe_clothing
from ..auth import get_current_user
from ..models import User
from ..schemas import AISuggestion
from .items import read_image

router = APIRouter(prefix="/api/ai", tags=["ai"])


@router.post("/describe", response_model=AISuggestion)
async def describe(file: UploadFile = File(...), me: User = Depends(get_current_user)):
    """Send a clothing photo, get back a suggested title, description, type, color, and style.
    Suggestions are editable; the user stays responsible for the final listing."""
    data, mime = await read_image(file)
    try:
        return await run_in_threadpool(describe_clothing, data, mime)
    except AIUnavailable as exc:
        raise HTTPException(503, f"AI descriptions are unavailable right now. {exc}") from exc
