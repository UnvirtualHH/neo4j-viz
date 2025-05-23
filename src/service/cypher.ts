import { driverInstance } from "../store/connection";
import { addQueryToHistory } from "../store/history";
import { CypherQueryResult, GraphRow } from "../types/graphdata";
import { DbSchema } from "../types/schema";
import neo4j from "neo4j-driver";
export async function runCypherQuery(
  query: string,
  parameters: Record<string, any> = {}
): Promise<CypherQueryResult> {
  const currentDriver = driverInstance();
  if (!currentDriver) throw new Error("Keine Verbindung zur Datenbank");

  const interpolated = interpolateQuery(query, parameters);
  addQueryToHistory(interpolated);

  const session = currentDriver.session();
  try {
    const result = await session.run(query, parameters);

    const nodeSet = new Set<string>();
    const relSet = new Set<string>();

    const labelCounter = new Map<string, number>();
    const relTypeCounter = new Map<string, number>();

    const columns = result.records[0]?.keys ?? [];
    const tableRows = result.records.map((record) => {
      const row: Record<string, any> = {};

      for (const key of record.keys) {
        const value = record.get(key);

        if (
          value === null ||
          typeof value === "string" ||
          typeof value === "boolean"
        ) {
          row[key as string] = value;
        } else if (typeof value === "number") {
          row[key as string] = value;
        } else if (neo4j.isInt(value)) {
          row[key as string] = value.toNumber();
        } else if (typeof value === "object") {
          row[key as string] = value;
        } else {
          row[key as string] = String(value);
        }
      }
      return row;
    });

    function countLabels(node: any) {
      if (!node || typeof node !== "object") return;
      if (!Array.isArray(node.labels)) return;

      for (const label of node.labels) {
        labelCounter.set(label, (labelCounter.get(label) ?? 0) + 1);
      }
    }

    function countRelType(r: any) {
      if (!r || typeof r !== "object") return;
      if (typeof r.type !== "string") return;

      relTypeCounter.set(r.type, (relTypeCounter.get(r.type) ?? 0) + 1);
    }

    const data: GraphRow[] = result.records.map((record) => {
      const keys = record.keys;

      const sourceNode = keys.length > 0 ? record.get(keys[0]) : undefined;
      const relation = keys.length > 1 ? record.get(keys[1]) : undefined;
      const targetNode = keys.length > 2 ? record.get(keys[2]) : undefined;

      if (sourceNode?.elementId) nodeSet.add(sourceNode.elementId);
      if (targetNode?.elementId) nodeSet.add(targetNode.elementId);
      if (relation?.type && sourceNode?.elementId && targetNode?.elementId) {
        relSet.add(
          `${sourceNode.elementId}->${relation.type}->${targetNode.elementId}`
        );
      }

      countLabels(sourceNode);
      countRelType(relation);
      countLabels(targetNode);

      return { sourceNode, relation, targetNode };
    });

    const nodeCount = nodeSet.size;
    const relationshipCount = relSet.size;

    const availableAfter = result.summary.resultAvailableAfter;
    const consumedAfter = result.summary.resultConsumedAfter;

    const executionTimeMs =
      (availableAfter?.toNumber?.() ?? 0) + (consumedAfter?.toNumber?.() ?? 0);

    console.log(data);
    console.log("Execution time:", executionTimeMs, "ms");
    console.log("Node count:", nodeCount);
    console.log("Relationship count:", relationshipCount);
    console.log("Label stats:", Object.fromEntries(labelCounter));
    console.log("Relationship type stats:", Object.fromEntries(relTypeCounter));
    console.log("Columns:", columns);
    console.log("Table rows:", tableRows);
    console.log("Query:", query);
    console.log("Parameters:", parameters);

    return {
      data,
      executionTimeMs,
      nodeCount,
      relationshipCount,
      labelStats: Object.fromEntries(labelCounter),
      relTypeStats: Object.fromEntries(relTypeCounter),
      columns,
      tableRows,
    };
  } finally {
    await session.close();
  }
}

export async function getFullSchema(): Promise<DbSchema> {
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
        propertyKeys: propsResult.records.map((r) => r.get(0)),
      };
    });

    return result;
  } finally {
    await session.close();
  }
}

export async function updateNodeProperty(
  id: string,
  key: string,
  value: any
): Promise<CypherQueryResult> {
  const query = `MATCH (n) WHERE elementId(n) = $id SET n[$key] = $value`;
  return runCypherQuery(query, { id, key, value });
}

export async function updateNodeProperties(
  elementId: string,
  props: Record<string, any>
) {
  const setClauses = Object.keys(props)
    .map((key) => `n.${key} = $${key}`)
    .join(", ");

  const query = `MATCH (n) WHERE elementId(n) = $elementId SET ${setClauses}`;
  const params = { elementId, ...props };

  return runCypherQuery(query, params);
}

export async function deleteByElementId(
  type: "node" | "relationship" | undefined,
  elementId: string
) {
  if (type === undefined) {
    throw new Error("Element type is undefined");
  }
  const query =
    type === "node"
      ? `MATCH (n) WHERE elementId(n) = $id DETACH DELETE n`
      : `MATCH ()-[r]-() WHERE elementId(r) = $id DELETE r`;
  await runCypherQuery(query, { id: elementId });
}

// just for internal query logging
function interpolateQuery(query: string, params: Record<string, any>): string {
  return query.replace(/\$([a-zA-Z0-9_]+)/g, (_, key) => {
    const value = params[key];
    if (value === undefined) return `$${key}`;

    if (typeof value === "string") return `"${value}"`;
    if (typeof value === "number" || typeof value === "boolean")
      return String(value);

    return JSON.stringify(value);
  });
}
