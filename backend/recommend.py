from db import conn


def get_collaborative_recs(user_id: int, limit: int = 10):
    """Recommend movies liked by users similar to this user, not yet seen by them."""
    query = """
    MATCH (u:User {userId: $userId})-[s:SIMILAR_TO]->(similarUser:User)
    MATCH (similarUser)-[r:RATED]->(m:Movie)
    WHERE r.rating >= 4
      AND NOT EXISTS { (u)-[:RATED]->(m) }
    RETURN m.title AS title, m.movieId AS movieId, m.genres AS genres,
           m.posterUrl AS posterUrl, avg(r.rating * s.score) AS score
    ORDER BY score DESC
    LIMIT $limit
    """
    return conn.query(query, {"userId": user_id, "limit": limit})


def get_similar_movies(movie_id: int, limit: int = 10):
    """Content-based: movies similar to a given movie via genome tags."""
    query = """
    MATCH (m:Movie {movieId: $movieId})-[c:CONTENT_SIMILAR_TO]->(rec:Movie)
    RETURN rec.title AS title, rec.movieId AS movieId, rec.genres AS genres,
           rec.posterUrl AS posterUrl, c.contentScore AS score
    ORDER BY score DESC
    LIMIT $limit
    """
    return conn.query(query, {"movieId": movie_id, "limit": limit})


def get_hybrid_recs(user_id: int, limit: int = 10):
    """Blend collaborative signal with content similarity to movies the user already liked."""
    query = """
    MATCH (u:User {userId: $userId})-[:RATED]->(seen:Movie)
    MATCH (seen)-[c:CONTENT_SIMILAR_TO]->(rec:Movie)
    WHERE NOT EXISTS { (u)-[:RATED]->(rec) }
    WITH u, rec, sum(c.contentScore) AS contentScore
    OPTIONAL MATCH (u)-[:SIMILAR_TO]->(:User)-[r:RATED]->(rec)
    WITH rec, contentScore, avg(coalesce(r.rating, 0)) AS collabScore
    RETURN rec.title AS title, rec.movieId AS movieId, rec.genres AS genres,
           rec.posterUrl AS posterUrl,
           (contentScore * 0.4 + collabScore * 0.6) AS score
    ORDER BY score DESC
    LIMIT $limit
    """
    return conn.query(query, {"userId": user_id, "limit": limit})


def list_movies(search: str = None, genre: str = None, min_rating: float = None,
                 sort: str = "title", page: int = 1, page_size: int = 24):
    """Browse/search movies with optional filters.
    Reads precomputed m.avgRating / m.ratingCount instead of aggregating
    RATED edges live - run precompute_ratings.cql first, and periodically
    afterward to keep stats fresh as new ratings come in."""
    skip = (page - 1) * page_size

    if search:
        # Full-text index - fast, tokenized prefix match instead of a
        # full CONTAINS scan.
        query = """
        CALL db.index.fulltext.queryNodes('movieTitleIndex', $searchQuery)
        YIELD node AS m, score
        WHERE ($genre IS NULL OR $genre IN m.genres)
          AND ($minRating IS NULL OR m.avgRating >= $minRating)
        RETURN m.movieId AS movieId, m.title AS title, m.genres AS genres,
               m.avgRating AS avgRating, m.ratingCount AS ratingCount,
               m.posterUrl AS posterUrl
        ORDER BY """ + ("m.avgRating DESC" if sort == "rating" else "score DESC") + """
        SKIP $skip LIMIT $pageSize
        """
        params = {
            "searchQuery": f"{search}*",
            "genre": genre, "minRating": min_rating,
            "skip": skip, "pageSize": page_size,
        }
    else:
        query = """
        MATCH (m:Movie)
        WHERE ($genre IS NULL OR $genre IN m.genres)
          AND ($minRating IS NULL OR m.avgRating >= $minRating)
        RETURN m.movieId AS movieId, m.title AS title, m.genres AS genres,
               m.avgRating AS avgRating, m.ratingCount AS ratingCount,
               m.posterUrl AS posterUrl
        ORDER BY """ + ("m.avgRating DESC" if sort == "rating" else "m.title ASC") + """
        SKIP $skip LIMIT $pageSize
        """
        params = {
            "genre": genre, "minRating": min_rating,
            "skip": skip, "pageSize": page_size,
        }

    return conn.query(query, params)


def get_movie_details(movie_id: int):
    """Full details for one movie: genres, precomputed avg rating, top genome tags."""
    query = """
    MATCH (m:Movie {movieId: $movieId})
    OPTIONAL MATCH (m)-[d:DESCRIBES]->(g:GenomeTag)
    WITH m, g, d
    ORDER BY d.relevance DESC
    WITH m, collect(g.tag)[..8] AS topTags
    RETURN m.movieId AS movieId, m.title AS title, m.genres AS genres,
           coalesce(m.avgRating, 0) AS avgRating,
           coalesce(m.ratingCount, 0) AS ratingCount,
           m.posterUrl AS posterUrl,
           topTags
    """
    result = conn.query(query, {"movieId": movie_id})
    return result[0] if result else None


def add_rating(user_id: int, movie_id: int, rating: float):
    """Create/update a rating edge. NOTE: does not retrain SIMILAR_TO/CONTENT_SIMILAR_TO -
    those only update when you re-run setup_graph.cql."""
    query = """
    MERGE (u:User {userId: $userId})
    MERGE (m:Movie {movieId: $movieId})
    MERGE (u)-[r:RATED]->(m)
    SET r.rating = $rating, r.timestamp = timestamp()
    RETURN u.userId AS userId, m.movieId AS movieId, r.rating AS rating
    """
    result = conn.query(query, {"userId": user_id, "movieId": movie_id, "rating": rating})
    return result[0] if result else None


def get_user_top_rated(user_id: int, limit: int = 10):
    """What the user already rated highly - useful for sanity-checking recs against taste."""
    query = """
    MATCH (u:User {userId: $userId})-[r:RATED]->(m:Movie)
    RETURN m.title AS title, m.movieId AS movieId, m.genres AS genres,
           m.posterUrl AS posterUrl, r.rating AS rating
    ORDER BY r.rating DESC
    LIMIT $limit
    """
    return conn.query(query, {"userId": user_id, "limit": limit})

def get_user_rating(user_id: int, movie_id: int):
    """Return the logged-in user's rating for a movie, if one exists."""
    query = """
    MATCH (u:User {userId: $userId})-[r:RATED]->(m:Movie {movieId: $movieId})
    RETURN r.rating AS rating
    LIMIT 1
    """
    result = conn.query(query, {"userId": user_id, "movieId": movie_id})
    return result[0]["rating"] if result else None
