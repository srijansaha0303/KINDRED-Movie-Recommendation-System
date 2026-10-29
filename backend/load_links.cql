// load_links.cql
// Loads imdbId/tmdbId from link.csv onto existing Movie nodes.
// PREREQUISITE: copy link.csv into your Neo4j DBMS's "import" folder first
// (Neo4j Desktop -> your DBMS -> ... -> Open folder -> Import).
// Run: cypher-shell -u neo4j -p <password> -d movie -f load_links.cql

LOAD CSV WITH HEADERS FROM 'file:///link.csv' AS row
MATCH (m:Movie {movieId: toInteger(row.movieId)})
SET m.imdbId = row.imdbId,
    m.tmdbId = CASE
                 WHEN row.tmdbId IS NOT NULL AND row.tmdbId <> ''
                 THEN toInteger(row.tmdbId)
                 ELSE null
               END;

// sanity check
MATCH (m:Movie) WHERE m.tmdbId IS NOT NULL RETURN count(m) AS withTmdbId;
