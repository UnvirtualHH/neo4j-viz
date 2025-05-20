export type LabelStats = Record<string, number>;
export type RelationshipTypeStats = Record<string, number>;

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

export type CypherQueryResult = {
  data: GraphRow[];
  nodeCount: number;
  relationshipCount: number;
  executionTimeMs: number;
  labelStats: LabelStats;
  relTypeStats: RelationshipTypeStats;
};
