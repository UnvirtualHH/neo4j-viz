export type Neo4jId = {
  low: number;
  high: number;
};

export type Neo4jNode = {
  identity: Neo4jId;
  labels: string[];
  properties: Record<string, any>;
  elementId: string;
};

export type Neo4jRelationship = {
  type: string;
  properties: Record<string, any>;
};

export type GraphRow = {
  a: Neo4jNode;
  r?: Neo4jRelationship;
  b?: Neo4jNode;
};