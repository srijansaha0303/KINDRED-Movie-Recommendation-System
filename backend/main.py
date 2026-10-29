from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from recommend import (
    get_collaborative_recs,
    get_similar_movies,
    get_hybrid_recs,
    get_user_top_rated,
    list_movies,
    get_movie_details,
    add_rating,
    get_user_rating,
)
from auth import create_user, authenticate_user, create_token, get_current_user


class RatingIn(BaseModel):
    movieId: int
    rating: float


class SignupIn(BaseModel):
    username: str
    password: str
    email: Optional[str] = None


class LoginIn(BaseModel):
    username: str
    password: str


app = FastAPI(title="Kindred API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"status": "ok", "message": "Kindred API is running"}


# ---------- Auth ----------

@app.post("/auth/signup")
def signup(payload: SignupIn):
    try:
        user = create_user(payload.username, payload.password, payload.email)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    token = create_token(user["userId"], user["username"])
    return {"token": token, "userId": user["userId"], "username": user["username"]}


@app.post("/auth/login")
def login(payload: LoginIn):
    user = authenticate_user(payload.username, payload.password)
    if not user:
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    token = create_token(user["userId"], user["username"])
    return {"token": token, "userId": user["userId"], "username": user["username"]}


@app.get("/auth/me")
def me(current_user: dict = Depends(get_current_user)):
    return current_user


# ---------- Recommendations (require a logged-in user) ----------

@app.get("/recommend/me")
def recommend_me(limit: int = 10, current_user: dict = Depends(get_current_user)):
    results = get_collaborative_recs(current_user["userId"], limit)
    # An empty list is a normal first-time-user state, not an API failure.
    return results


@app.get("/hybrid/me")
def hybrid_me(limit: int = 10, current_user: dict = Depends(get_current_user)):
    results = get_hybrid_recs(current_user["userId"], limit)
    # An empty list is a normal first-time-user state, not an API failure.
    return results


@app.get("/top-rated/me")
def top_rated_me(limit: int = 10, current_user: dict = Depends(get_current_user)):
    results = get_user_top_rated(current_user["userId"], limit)
    return results


# ---------- Public browsing (no login required) ----------

@app.get("/movies")
def movies(
    search: Optional[str] = None,
    genre: Optional[str] = None,
    min_rating: Optional[float] = None,
    sort: str = "title",
    page: int = 1,
    page_size: int = 24,
):
    return list_movies(search, genre, min_rating, sort, page, page_size)


@app.get("/movies/{movie_id}")
def movie_detail(movie_id: int):
    result = get_movie_details(movie_id)
    if not result:
        raise HTTPException(status_code=404, detail="Movie not found")
    return result


@app.get("/similar/{movie_id}")
def similar(movie_id: int, limit: int = 10):
    results = get_similar_movies(movie_id, limit)
    if not results:
        raise HTTPException(status_code=404, detail="No similar movies found")
    return results


# ---------- Rating (requires login - identifies the user from the token) ----------

@app.post("/rate")
def rate(payload: RatingIn, current_user: dict = Depends(get_current_user)):
    if payload.rating < 1 or payload.rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5 stars")
    result = add_rating(current_user["userId"], payload.movieId, payload.rating)
    if not result:
        raise HTTPException(status_code=400, detail="Could not save rating")
    return result

@app.get("/rating/{movie_id}")
def my_movie_rating(movie_id: int, current_user: dict = Depends(get_current_user)):
    return {"movieId": movie_id, "rating": get_user_rating(current_user["userId"], movie_id)}
