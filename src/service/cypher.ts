import { GraphRow } from "../types/graphdata";
import { driver } from "./neo4j";

export async function runCypherQuery(query: string): Promise<GraphRow[]> {
  const session = driver.session();
  const result = await session.run(query);

  const parsed: GraphRow[] = result.records.map((record) => {
    const [a, r, b] = record._fields;
    return { a, r, b };
  });

  await session.close();
  return parsed;
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
