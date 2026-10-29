from neo4j import GraphDatabase

class Neo4jConnection:
    def __init__(self, uri, user, password, database="movie"):
        self.driver = GraphDatabase.driver(uri, auth=(user, password))
        self.database = database

    def close(self):
        self.driver.close()

    def query(self, query, parameters=None):
        with self.driver.session(database=self.database) as session:
            result = session.run(query, parameters or {})
            return [record.data() for record in result]

# --- EDIT THESE THREE VALUES ---
NEO4J_URI = "bolt://localhost:7687"
NEO4J_USER = "neo4j"
NEO4J_PASSWORD = "Eureka@123"   # change this to match your actual password
# --------------------------------

conn = Neo4jConnection(NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD)
