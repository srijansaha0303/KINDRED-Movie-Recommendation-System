"""
fetch_posters.py
One-time (resumable) script: for every Movie with a tmdbId and no posterUrl
yet, fetch its poster path from TMDB and store it as a property on the node.

Run from the backend folder, venv active:
    pip install requests
    python fetch_posters.py

Safe to stop (Ctrl+C) and re-run - it only processes movies that don't
already have a posterUrl set, so it picks up where it left off.
"""

import time
import requests
from db import conn

# --- EDIT THIS ---
TMDB_API_KEY = "8f6535900a81d02669fac61c046fc454"
# ------------------

TMDB_BASE = "https://api.themoviedb.org/3/movie"
IMAGE_BASE = "https://image.tmdb.org/t/p/w500"  # 500px wide poster
BATCH_SIZE = 200          # how many movies to pull from Neo4j per round
REQUEST_DELAY = 0.03      # ~35 req/sec, under TMDB's ~40 req/sec limit


def get_movies_needing_posters(limit: int):
    query = """
    MATCH (m:Movie)
    WHERE m.tmdbId IS NOT NULL AND m.posterUrl IS NULL
    RETURN m.movieId AS movieId, m.tmdbId AS tmdbId
    LIMIT $limit
    """
    return conn.query(query, {"limit": limit})


def save_poster(movie_id: int, poster_url: str):
    query = """
    MATCH (m:Movie {movieId: $movieId})
    SET m.posterUrl = $posterUrl
    """
    conn.query(query, {"movieId": movie_id, "posterUrl": poster_url})


def mark_no_poster(movie_id: int):
    # TMDB has no poster for this one - mark it so we don't keep retrying it
    query = """
    MATCH (m:Movie {movieId: $movieId})
    SET m.posterUrl = ""
    """
    conn.query(query, {"movieId": movie_id})


def fetch_poster_path(tmdb_id: int):
    url = f"{TMDB_BASE}/{tmdb_id}"
    resp = requests.get(url, params={"api_key": TMDB_API_KEY}, timeout=10)
    if resp.status_code != 200:
        return None
    data = resp.json()
    poster_path = data.get("poster_path")
    return f"{IMAGE_BASE}{poster_path}" if poster_path else None


def main():
    total_done = 0
    while True:
        batch = get_movies_needing_posters(BATCH_SIZE)
        if not batch:
            print(f"Done. Processed {total_done} movies total this run.")
            break

        for row in batch:
            movie_id = row["movieId"]
            tmdb_id = row["tmdbId"]
            try:
                poster_url = fetch_poster_path(tmdb_id)
                if poster_url:
                    save_poster(movie_id, poster_url)
                else:
                    mark_no_poster(movie_id)
            except requests.RequestException as e:
                print(f"  network error on movieId={movie_id}: {e} - will retry next run")
                continue

            total_done += 1
            if total_done % 100 == 0:
                print(f"  ...{total_done} movies processed")

            time.sleep(REQUEST_DELAY)


if __name__ == "__main__":
    if TMDB_API_KEY == "YOUR_TMDB_API_KEY_HERE":
        raise SystemExit("Edit TMDB_API_KEY at the top of this file first.")
    main()
