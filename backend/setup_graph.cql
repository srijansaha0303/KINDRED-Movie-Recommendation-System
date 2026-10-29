// ============================================================
// setup_graph.cql
// Rebuilds GDS in-memory projections + embeddings + similarity
// edges for the movie recommendation system.
// ============================================================

// ---- 0. Constraints ----
CREATE CONSTRAINT user_id IF NOT EXISTS
FOR (u:User) REQUIRE u.userId IS UNIQUE;

CREATE CONSTRAINT movie_id IF NOT EXISTS
FOR (m:Movie) REQUIRE m.movieId IS UNIQUE;

CREATE CONSTRAINT tag_id IF NOT EXISTS
FOR (t:Tag) REQUIRE t.tagId IS UNIQUE;

CREATE CONSTRAINT genome_tag_id IF NOT EXISTS
FOR (g:GenomeTag) REQUIRE g.tagId IS UNIQUE;


// ---- 1. Drop stale projections ----
CALL gds.graph.drop('userMovieGraph', false);

CALL gds.graph.drop('movieContentGraph', false);


// ---- 2. Project User-Movie graph ----
CALL gds.graph.project(
  'userMovieGraph',
  ['Movie', 'User'],
  {
    RATED: {
      orientation: 'NATURAL',
      properties: {
        rating: {
          property: 'rating',
          defaultValue: null,
          aggregation: 'DEFAULT'
        }
      }
    }
  }
);


// ---- 3. FastRP embeddings ----
CALL gds.fastRP.mutate('userMovieGraph', {
  embeddingDimension: 128,
  iterationWeights: [0.8, 1, 1, 1],
  relationshipWeightProperty: 'rating',
  randomSeed: 42,
  mutateProperty: 'embedding'
});


// ---- 4. KNN similarity ----
CALL gds.knn.write('userMovieGraph', {
  nodeProperties: ['embedding'],
  topK: 15,
  sampleRate: 1.0,
  deltaThreshold: 0.001,
  writeRelationshipType: 'SIMILAR_TO',
  writeProperty: 'score'
});


// ---- 5. Project Movie-GenomeTag graph ----
CALL gds.graph.project(
  'movieContentGraph',
  ['Movie', 'GenomeTag'],
  {
    DESCRIBES: {
      orientation: 'NATURAL',
      properties: 'relevance'
    }
  }
);


// ---- 6. FastRP content embeddings ----
CALL gds.fastRP.mutate('movieContentGraph', {
  embeddingDimension: 64,
  relationshipWeightProperty: 'relevance',
  randomSeed: 42,
  mutateProperty: 'contentEmbedding'
});


// ---- 7. Content similarity ----
CALL gds.knn.write('movieContentGraph', {
  nodeProperties: ['contentEmbedding'],
  topK: 10,
  writeRelationshipType: 'CONTENT_SIMILAR_TO',
  writeProperty: 'contentScore'
});


// ---- 8. Sanity checks ----
MATCH (:User)-[r:SIMILAR_TO]->(:User)
RETURN count(r) AS userSimilarityEdges;

MATCH (:Movie)-[r:CONTENT_SIMILAR_TO]->(:Movie)
RETURN count(r) AS movieContentEdges;