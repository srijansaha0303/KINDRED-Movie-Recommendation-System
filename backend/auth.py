import os
import time
import jwt
from passlib.context import CryptContext
from fastapi import Header, HTTPException
from db import conn

# In production, set this via an actual environment variable - don't
# leave the fallback in place for anything beyond local dev.
SECRET_KEY = os.environ.get("JWT_SECRET", "change-this-secret-in-production")
ALGORITHM = "HS256"
TOKEN_EXPIRY_SECONDS = 60 * 60 * 24 * 7  # 7 days

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return pwd_context.verify(password, password_hash)


def create_token(user_id: int, username: str) -> str:
    payload = {
        "userId": user_id,
        "username": username,
        "exp": int(time.time()) + TOKEN_EXPIRY_SECONDS,
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


def get_current_user(authorization: str = Header(None)) -> dict:
    """FastAPI dependency - pulls the Bearer token off the Authorization
    header and returns the decoded {userId, username} payload."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or malformed Authorization header")
    token = authorization.split(" ", 1)[1]
    return decode_token(token)


def create_user(username: str, password: str, email: str = None):
    existing = conn.query(
        "MATCH (u:User {username: $username}) RETURN u LIMIT 1",
        {"username": username},
    )
    if existing:
        raise ValueError("Username already taken")

    # Your graph already has 138,493 User nodes from ratings.csv with
    # numeric userIds and no username/password. New signups get the next
    # free integer ID so they coexist in the same User label without
    # colliding with the historical MovieLens users.
    next_id_result = conn.query(
        "MATCH (u:User) RETURN coalesce(max(u.userId), 0) + 1 AS nextId"
    )
    next_id = next_id_result[0]["nextId"]

    password_hash = hash_password(password)
    result = conn.query(
        """
        CREATE (u:User {
            userId: $userId,
            username: $username,
            passwordHash: $passwordHash,
            email: $email,
            createdAt: timestamp()
        })
        RETURN u.userId AS userId, u.username AS username
        """,
        {"userId": next_id, "username": username, "passwordHash": password_hash, "email": email},
    )
    return result[0]


def authenticate_user(username: str, password: str):
    result = conn.query(
        """
        MATCH (u:User {username: $username})
        RETURN u.userId AS userId, u.username AS username, u.passwordHash AS passwordHash
        LIMIT 1
        """,
        {"username": username},
    )
    if not result:
        return None
    user = result[0]
    if not user.get("passwordHash") or not verify_password(password, user["passwordHash"]):
        return None
    return user
