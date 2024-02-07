import os

from neo4j import GraphDatabase


def main(args):
    """
    Retrieve unspent UTxOs (Unspent Transaction Outputs) for a given address.
    """
    address = args.get("address", "")
    uri = os.getenv('NEO4J_URI')
    username = os.getenv('NEO4J_USERNAME')
    password = os.getenv('NEO4J_PASSWORD')
    # Initialize the database driver
    driver = GraphDatabase.driver(uri, auth=(username, password))
    # bad address length
    if len(address) < 58:
        return {"body": []}
    try:
        with driver.session() as session:
            result = session.run(
                """
                MATCH (n:Node)
                USING INDEX n:Node(address)
                WHERE n.address = $property_value
                AND
                NOT (n)-[]->()
                RETURN n
                """,
                property_value=address
            )
            records = [record["n"] for record in result]
        return {"body": records}
    finally:
        driver.close()
