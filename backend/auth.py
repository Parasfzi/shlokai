"""
ShlokAI — Authentication & Authorization
Handles JWT tokens and password hashing.
"""

import os
import hashlib
import binascii
import jwt
from datetime import datetime, timedelta, timezone
from fastapi import Header, HTTPException, status
import resend

SECRET_KEY = os.getenv("SECRET_KEY", "fallback_secret_key_shlokai_gita_9999")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24 * 7  # 1 week
RESET_TOKEN_EXPIRE_MINUTES = 15     # Short-lived for security

# ─── Frontend URL for reset links ─────────────────────────────────────────────
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://shlokai.paraspawar.in")

def hash_password(password: str) -> str:
    """Hash a password securely using PBKDF2."""
    salt = hashlib.sha256(os.urandom(60)).hexdigest().encode('ascii')
    pwdhash = hashlib.pbkdf2_hmac('sha512', password.encode('utf-8'), salt, 100000)
    pwdhash = binascii.hexlify(pwdhash)
    return (salt + pwdhash).decode('ascii')

def verify_password(stored_password: str, provided_password: str) -> bool:
    """Verify a stored password against one provided by user."""
    salt = stored_password[:64].encode('ascii')
    stored_hash = stored_password[64:]
    pwdhash = hashlib.pbkdf2_hmac('sha512', provided_password.encode('utf-8'), salt, 100000)
    pwdhash = binascii.hexlify(pwdhash).decode('ascii')
    return pwdhash == stored_hash

def create_access_token(data: dict) -> str:
    """Create a new JWT access token."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user_id(authorization: str = Header(None)) -> int:
    """
    FastAPI Dependency to get current user_id from Bearer token.
    Throws Exception if token is missing or invalid.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authentication token"
        )
        
    token = authorization.split(" ")[1]
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        return int(user_id)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


# ─── PASSWORD RESET TOKEN ─────────────────────────────────────────────────────

def create_reset_token(user_id: int) -> str:
    """
    Create a short-lived JWT specifically for password reset.
    Includes "type": "reset" to prevent misuse of regular access tokens.
    Expires in 15 minutes.
    """
    to_encode = {
        "sub": str(user_id),
        "type": "reset",  # Critical: differentiates from access tokens
        "exp": datetime.now(timezone.utc) + timedelta(minutes=RESET_TOKEN_EXPIRE_MINUTES),
    }
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def verify_reset_token(token: str) -> int:
    """
    Verify a password reset token and return the user_id.
    Raises HTTPException if token is invalid, expired, or not a reset token.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        # SECURITY: Reject tokens that aren't specifically reset tokens
        # This prevents attackers from using stolen access tokens to reset passwords
        token_type = payload.get("type")
        if token_type != "reset":
            raise HTTPException(
                status_code=400,
                detail="Invalid token type. This is not a password reset token."
            )
        
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=400, detail="Invalid reset token payload")
        
        return int(user_id)
    
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=400,
            detail="Reset link has expired. Please request a new one."
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=400,
            detail="Invalid or tampered reset token."
        )


def generate_reset_link(token: str) -> str:
    """Generate the full password reset URL for the frontend."""
    return f"{FRONTEND_URL}/reset-password?token={token}"


def send_reset_email(email: str, reset_link: str):
    """
    Send password reset email to the user using Resend.
    """
    api_key = os.getenv("RESEND_API_KEY")
    if not api_key:
        print("\n[WRN] RESEND_API_KEY missing. Printing reset link to console:")
        print(f"To: {email} | Link: {reset_link}\n")
        return

    resend.api_key = api_key
    
    try:
        resend.Emails.send({
            "from": "ShlokAI <onboarding@resend.dev>",
            "to": email,
            "subject": "🕉️ ShlokAI — Reset Your Password",
            "html": f"""
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #ffae00; text-align: center;">Reset Your Password</h2>
                    <p>Namaste,</p>
                    <p>You requested a password reset for your ShlokAI account. Click the button below to set a new password:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{reset_link}" style="background-color: #ffae00; color: #000; padding: 12px 25px; text-decoration: none; font-weight: bold; border-radius: 5px; display: inline-block;">Reset Password</a>
                    </div>
                    <p>This link will expire in <strong>{RESET_TOKEN_EXPIRE_MINUTES} minutes</strong>.</p>
                    <p>If you did not request this, please ignore this email.</p>
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="font-size: 0.8rem; color: #888; text-align: center;">ShlokAI — Sacred Knowledge Search Engine</p>
                </div>
            """
        })
        print(f"[OK] Reset email sent to {email}")
    except Exception as e:
        print(f"[ERR] Failed to send email via Resend: {e}")
        # Fallback to console so the user isn't stuck during testing
        print(f"Fallback Link: {reset_link}")
