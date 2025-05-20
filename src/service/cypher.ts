import { driver } from "./neo4j";

export async function runCypherQuery(query: string) {
  const session = driver.session();

  try {
    const result = await session.run(query);
    return result.records.map((record) => record.toObject());
  } catch (error) {
    console.error("Neo4j query error:", error);
    throw error;
  } finally {
    await session.close();
  }
}

export async function getFullSchema() {
  const session = driver.session();

  try {
    const result = await session.executeRead(async (tx) => {
      const [labelsResult, relsResult, propsResult] = await Promise.all([
        tx.run("CALL db.labels()"),
        tx.run("CALL db.relationshipTypes()"),
        tx.run("CALL db.propertyKeys()"),
      ]);

      return {
        labels: labelsResult.records.map((r) => r.get(0)),
        relationshipTypes: relsResult.records.map((r) => r.get(0)),
        allProperties: propsResult.records.map((r) => r.get(0)),
      };
    });

    return result;
  } finally {
    await session.close();
  }
}
