import { driverInstance } from "../store/connection";
import { addQueryToHistory } from "../store/history";
import { CypherQueryResult, GraphRow } from "../types/graphdata";
import { DbSchema } from "../types/schema";
import neo4j from "neo4j-driver";

// ========== Utils ==========

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

function isNeo4jNode(value: any): boolean {
  return (
    value &&
    typeof value === "object" &&
    "elementId" in value &&
    "labels" in value
  );
}

function isNeo4jRelationship(value: any): boolean {
  return (
    value &&
    typeof value === "object" &&
    "elementId" in value &&
    "type" in value
  );
}

function countLabels(node: any, labelCounter: Map<string, number>) {
  if (!node?.labels || !Array.isArray(node.labels)) return;
  for (const label of node.labels) {
    labelCounter.set(label, (labelCounter.get(label) ?? 0) + 1);
  }
}

function countRelType(rel: any, relTypeCounter: Map<string, number>) {
  if (!rel?.type) return;
  relTypeCounter.set(rel.type, (relTypeCounter.get(rel.type) ?? 0) + 1);
}

// ========== Query ==========

export async function runCypherQuery(
  query: string,
  parameters: Record<string, any> = {}
): Promise<CypherQueryResult> {
  const driver = driverInstance();
  if (!driver) throw new Error("Keine Verbindung zur Datenbank");

  addQueryToHistory(interpolateQuery(query, parameters));

  const session = driver.session();

  try {
    const result = await session.run(query, parameters);

    const columns = result.records[0]?.keys ?? [];

    const tableRows = result.records.map((record) => {
      const row: Record<string, any> = {};
      for (const key of record.keys) {
        const value = record.get(key);
        if (
          value === null ||
          typeof value === "string" ||
          typeof value === "boolean" ||
          typeof value === "number"
        ) {
          row[key as string] = value;
        } else if (neo4j.isInt(value)) {
          row[key as string] = value.toNumber();
        } else {
          row[key as string] = value;
        }
      }
      return row;
    });

    const data: GraphRow[] = [];
    const labelCounter = new Map<string, number>();
    const relTypeCounter = new Map<string, number>();
    const nodeSet = new Set<string>();
    const relSet = new Set<string>();

    for (const record of result.records) {
      const entry: GraphRow = {
        sourceNode: undefined,
        relation: undefined,
        targetNode: undefined,
      };

      for (const key of record.keys) {
        const value = record.get(key);

        if (isNeo4jNode(value) && !entry.sourceNode) {
          entry.sourceNode = value;
          countLabels(value, labelCounter);
          if (value.elementId) nodeSet.add(value.elementId);
        } else if (isNeo4jRelationship(value)) {
          entry.relation = value;
          countRelType(value, relTypeCounter);
        } else if (isNeo4jNode(value) && !entry.targetNode) {
          entry.targetNode = value;
          countLabels(value, labelCounter);
          if (value.elementId) nodeSet.add(value.elementId);
        }
      }

      if (entry.sourceNode || entry.relation || entry.targetNode) {
        data.push(entry);
        if (
          entry.relation?.type &&
          entry.sourceNode?.elementId &&
          entry.targetNode?.elementId
        ) {
          relSet.add(
            `${entry.sourceNode.elementId}->${entry.relation.type}->${entry.targetNode.elementId}`
          );
        }
      }
    }

    const executionTimeMs =
      (result.summary.resultAvailableAfter?.toNumber?.() ?? 0) +
      (result.summary.resultConsumedAfter?.toNumber?.() ?? 0);

    return {
      data,
      columns,
      tableRows,
      isGraphLike: data.length > 0,
      executionTimeMs,
      nodeCount: nodeSet.size,
      relationshipCount: relSet.size,
      labelStats: Object.fromEntries(labelCounter),
      relTypeStats: Object.fromEntries(relTypeCounter),
    };
  } finally {
    await session.close();
  }
}

// ========== Schema ==========

export async function getFullSchema(): Promise<DbSchema> {
  const driver = driverInstance();
  if (!driver) throw new Error("Keine Verbindung zur Datenbank");

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
        propertyKeys: propsResult.records.map((r) => r.get(0)),
      };
    });
    return result;
  } finally {
    await session.close();
  }
}

// ========== CRUD ==========

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
): Promise<CypherQueryResult> {
  const setClause = Object.keys(props)
    .map((k) => `n.${k} = $${k}`)
    .join(", ");
  const query = `MATCH (n) WHERE elementId(n) = $elementId SET ${setClause}`;
  return runCypherQuery(query, { elementId, ...props });
}

export async function deleteByElementId(
  type: "node" | "relationship" | undefined,
  elementId: string
): Promise<void> {
  if (!type) throw new Error("Element type is undefined");
  const query =
    type === "node"
      ? `MATCH (n) WHERE elementId(n) = $id DETACH DELETE n`
      : `MATCH ()-[r]-() WHERE elementId(r) = $id DELETE r`;
  await runCypherQuery(query, { id: elementId });
}
