export type Data = {
  [key: string]: any;
};

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
  identity: Neo4jId;
  type: string;
  properties: Record<string, any>;
  elementId: string;
};

export type GraphRow = {
  sourceNode: Neo4jNode;
  relation?: Neo4jRelationship;
  targetNode?: Neo4jNode;
};

export type CypherQueryResult = {
  data: GraphRow[];
  nodeCount: number;
  relationshipCount: number;
  executionTimeMs: number;
  labelStats: LabelStats;
  relTypeStats: RelationshipTypeStats;

  columns?: PropertyKey[];
  tableRows?: Record<string, any>[];
};
