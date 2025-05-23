import { driverInstance } from "../store/connection";
import { addQueryToHistory } from "../store/history";
import {
  CypherQueryResult,
  GraphRow,
  Neo4jNode,
  Neo4jRelationship,
} from "../types/graphdata";
import { DbSchema } from "../types/schema";

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

    function countLabels(node?: Neo4jNode) {
      if (!node) return;
      for (const label of node.labels) {
        labelCounter.set(label, (labelCounter.get(label) ?? 0) + 1);
      }
    }

    function countRelType(r?: Neo4jRelationship) {
      if (!r?.type) return;
      relTypeCounter.set(r.type, (relTypeCounter.get(r.type) ?? 0) + 1);
    }

    const data: GraphRow[] = result.records.map((record) => {
      const [sourceNode, relation, targetNode] = record._fields;

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

    return {
      data,
      executionTimeMs,
      nodeCount,
      relationshipCount,
      labelStats: Object.fromEntries(labelCounter),
      relTypeStats: Object.fromEntries(relTypeCounter),
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
