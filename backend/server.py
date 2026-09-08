from dotenv import load_dotenv
load_dotenv()

import os
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware

from core.db import ensure_indexes, client
from core.email_service import email_enabled
from routers import auth, ledger, sync, export

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger("server")


@asynccontextmanager
async def lifespan(app: FastAPI):
    await ensure_indexes()
    logger.info("Email delivery: %s | Google Sign-In: %s",
                "ON" if email_enabled() else "OFF (dev mode, OTP in logs/response)",
                "ON" if os.environ.get("GOOGLE_CLIENT_IDS") else "OFF (not configured)")
    yield
    client.close()


app = FastAPI(title=os.environ.get("APP_NAME", "Ledger by Arsonist"), version="1.0.0", lifespan=lifespan)

api = APIRouter(prefix="/api")


@api.get("/")
async def root():
    return {"app": os.environ.get("APP_NAME", "Ledger by Arsonist"), "status": "ok"}


@api.get("/health")
async def health():
    await client.admin.command("ping")
    return {"status": "ok", "email_delivery": email_enabled(), "google_signin": bool(os.environ.get("GOOGLE_CLIENT_IDS"))}


api.include_router(auth.router)
api.include_router(ledger.router)
api.include_router(sync.router)
api.include_router(export.router)
app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in os.environ.get("CORS_ORIGINS", "").split(",") if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
