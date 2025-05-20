import { GraphRow } from "../types/graphdata";
import { driverInstance } from "../state/connection";

export async function runCypherQuery(query: string): Promise<GraphRow[]> {
  const currentDriver = driverInstance();
  if (!currentDriver) throw new Error("Keine Verbindung zur Datenbank");

  const session = currentDriver.session();
  const result = await session.run(query);

  const parsed: GraphRow[] = result.records.map((record) => {
    const [a, r, b] = record._fields;
    return { a, r, b };
  });

  await session.close();
  return parsed;
}

export async function getFullSchema() {
  const currentDriver = driverInstance();
  if (!currentDriver) throw new Error("Keine Verbindung zur Datenbank");

  const session = currentDriver.session();

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
