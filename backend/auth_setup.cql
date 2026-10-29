// Run once in Neo4j Browser (or via cypher-shell like your other scripts).
// Lets existing MovieLens User nodes (no username) coexist with real
// signups (which do have a username) - constraint only enforces
// uniqueness among nodes that actually have the property set.
CREATE CONSTRAINT user_username IF NOT EXISTS FOR (u:User) REQUIRE u.username IS UNIQUE;
