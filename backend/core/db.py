import os
from motor.motor_asyncio import AsyncIOMotorClient

client = AsyncIOMotorClient(os.environ["MONGO_URL"])
db = client[os.environ["DB_NAME"]]

NO_ID = {"_id": 0}

ENTITY_COLLECTIONS = ["bank_accounts", "credit_cards", "categories", "transactions", "budget_targets"]


async def ensure_indexes():
    await db.users.create_index("email", unique=True)
    await db.users.create_index("id", unique=True)
    await db.otp_codes.create_index("expires_at", expireAfterSeconds=0)
    await db.otp_codes.create_index([("email", 1), ("purpose", 1)])
    await db.refresh_tokens.create_index("expires_at", expireAfterSeconds=0)
    await db.refresh_tokens.create_index("token_hash", unique=True)
    await db.login_attempts.create_index("identifier")
    await db.login_attempts.create_index("expires_at", expireAfterSeconds=0)
    for name in ENTITY_COLLECTIONS:
        await db[name].create_index([("user_id", 1), ("id", 1)], unique=True)
        await db[name].create_index([("user_id", 1), ("updated_at", 1)])
    await db.transactions.create_index([("user_id", 1), ("date", -1)])
