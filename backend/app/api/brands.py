from fastapi import APIRouter

from app.db import fetch_all

router = APIRouter(tags=["brands"])


@router.get("/brands")
async def list_brands():
    rows = await fetch_all(
        "SELECT id, store_domain, display_name, created_at FROM brands ORDER BY id"
    )
    return {"brands": rows}
