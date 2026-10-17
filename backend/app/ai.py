"""Groq: turn a clothing photo into an editable listing suggestion.

The photo is sent from OUR SERVER to Groq, so the API key never reaches the browser.
The answer is only a suggestion; the owner reviews and edits it before saving.
"""
import base64
import json
import re

from groq import Groq

from .config import get_settings
from .schemas import COLORS, ITEM_TYPES, STYLES, AISuggestion

settings = get_settings()


class AIUnavailable(Exception):
    pass


PROMPT = f"""You help college students list clothing they are willing to lend to friends.
Look at the photo and reply with ONLY a JSON object (no other text) with these fields:
- "title": a short name for the item, max 6 words, like "Black satin slip dress".
- "description": 1-2 friendly sentences about the look, fit, and occasions it suits.
  Do not guess the brand, size, price, or material unless it is clearly visible.
- "item_type": exactly one of {ITEM_TYPES}, or null if unclear.
- "color": the main color, exactly one of {COLORS}, or null if unclear.
- "style": exactly one of {STYLES}, or null if unclear.
- "confidence_note": a short note if something is uncertain (e.g. "Could be a skirt or a dress"), otherwise null.
If the photo does not show clothing, shoes, or a bag, set "title" to "Not a clothing item" and explain in "confidence_note"."""


_client: Groq | None = None


def _get_client() -> Groq:
    global _client
    if not settings.groq_api_key:
        raise AIUnavailable("GROQ_API_KEY is not set on the server.")
    if _client is None:
        _client = Groq(api_key=settings.groq_api_key, timeout=30.0)
    return _client


def _extract_json(text: str) -> dict:
    """Models sometimes wrap JSON in <think> blocks or code fences. Pull out the JSON object."""
    text = re.sub(r"<think>.*?</think>", "", text or "", flags=re.DOTALL)
    start, end = text.find("{"), text.rfind("}")
    if start == -1 or end <= start:
        raise ValueError("no JSON object in model reply")
    return json.loads(text[start:end + 1])


def describe_clothing(image: bytes, mime_type: str) -> AISuggestion:
    client = _get_client()
    data_url = f"data:{mime_type};base64,{base64.b64encode(image).decode()}"
    try:
        resp = client.chat.completions.create(
            model=settings.groq_model,
            messages=[{"role": "user", "content": [
                {"type": "text", "text": PROMPT},
                {"type": "image_url", "image_url": {"url": data_url}},
            ]}],
            response_format={"type": "json_object"},
            temperature=0.4,
            max_completion_tokens=1500,
        )
        raw = resp.choices[0].message.content or ""
        parsed = AISuggestion.model_validate(_extract_json(raw))
    except AIUnavailable:
        raise
    except Exception as exc:  # network errors, quota, bad key, unparseable reply...
        raise AIUnavailable(f"Groq request failed: {exc}") from exc

    # Keep only values the app understands; anything else becomes "please choose".
    if parsed.item_type not in ITEM_TYPES:
        parsed.item_type = None
    if parsed.color not in COLORS:
        parsed.color = None
    if parsed.style not in STYLES:
        parsed.style = None
    parsed.title = parsed.title.strip()[:80]
    parsed.description = parsed.description.strip()[:600]
    return parsed