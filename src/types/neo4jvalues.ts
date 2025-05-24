import neo4j from "neo4j-driver";

export type Neo4jValueType =
  | "string"
  | "boolean"
  | "integer"
  | "float"
  | "date"
  | "time"
  | "localTime"
  | "dateTime"
  | "localDateTime"
  | "duration"
  | "point"
  | "map"
  | "list"
  | "null"
  | "id"
  | "elementId"
  | "any";

export function inferNeo4jType(value: any): Neo4jValueType {
  if (value === null) return "null";
  if (neo4j.isInt?.(value)) return "integer";
  if (neo4j.isDate?.(value)) return "date";
  if (neo4j.isTime?.(value)) return "time";
  if (neo4j.isLocalTime?.(value)) return "localTime";
  if (neo4j.isDateTime?.(value)) return "dateTime";
  if (neo4j.isLocalDateTime?.(value)) return "localDateTime";
  if (neo4j.isDuration?.(value)) return "duration";
  if (neo4j.isPoint?.(value)) return "point";

  if (typeof value === "string") return "string";
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "number")
    return Number.isInteger(value) ? "integer" : "float";
  if (Array.isArray(value)) return "list";

  if (typeof value === "object") {
    if ("latitude" in value && "longitude" in value) return "point";
    return "map";
  }

  return "any";
}
