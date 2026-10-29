import csv
from backend.db import conn

csv_path = r"C:\Users\srija\OneDrive\Desktop\MovieRecommendation\backend\data\movielens\movie.csv"

query = """
UNWIND $movies AS movie
MATCH (m:Movie {movieId: movie.movieId})
SET m.title = movie.title,
    m.genres = movie.genres
"""

movies = []

with open(csv_path, "r", encoding="utf-8") as file:
    reader = csv.DictReader(file)
    for row in reader:
        movies.append({
            "movieId": int(row["movieId"]),
            "title": row["title"],
            "genres": row["genres"].split("|")
        })

print(f"Loaded {len(movies)} movies from CSV")

for i in range(0, len(movies), 5000):
    batch = movies[i:i + 5000]
    conn.query(query, {"movies": batch})
    print(f"Updated {min(i + 5000, len(movies))}/{len(movies)}")

print("Done")