// precompute_ratings.cql
// Run this once now, then re-run any time you want stats refreshed
// (e.g. after new ratings come in via /rate).
// Usage: cypher-shell -u neo4j -p <password> -d movie -f precompute_ratings.cql

CALL {
  MATCH (m:Movie)
  OPTIONAL MATCH (m)<-[r:RATED]-()
  WITH m, avg(r.rating) AS avgRating, count(r) AS ratingCount
  SET m.avgRating = coalesce(avgRating, 0.0),
      m.ratingCount = ratingCount
} IN TRANSACTIONS OF 2000 ROWS;

// Index so sorting/filtering by rating doesn't need a full scan either
CREATE INDEX movie_avg_rating IF NOT EXISTS FOR (m:Movie) ON (m.avgRating);

// Full-text index for fast title search (replaces the slow CONTAINS scan)
CREATE FULLTEXT INDEX movieTitleIndex IF NOT EXISTS FOR (m:Movie) ON EACH [m.title];

// sanity check
MATCH (m:Movie) WHERE m.avgRating > 0 RETURN count(m) AS moviesWithRatings;
