import { Container } from "pixi.js";
import { Data } from "../types/graphdata";
import Edge, { EdgeProperties } from "./edge";
import Node, { NodeId, NodeProperties } from "./node";

class NetworkGraph extends Container {
  nodes: Map<NodeId, Node> = new Map();
  edges: Edge<Data>[] = [];

  constructor() {
    super();
  }

  addNode(properties: NodeProperties) {
    const node = new Node(properties);
    this.nodes.set(properties.id, node);
    this.addChild(node);
  }

  addEdge<T extends Data>(
    properties: Omit<EdgeProperties<T>, "startNode" | "endNode"> & {
      startId: NodeId;
      endId: NodeId;
    }
  ) {
    const startNode = this.nodes.get(properties.startId);
    const endNode = this.nodes.get(properties.endId);
    if (!startNode || !endNode) {
      throw new Error("Invalid node IDs for edge");
    }

    const edge = new Edge<T>({
      ...properties,
      startNode,
      endNode,
    });
    this.edges.push(edge as unknown as Edge<Data>);
    this.addChild(edge);
  }

  updateEdges() {
    this.edges.forEach((edge) => edge.drawEdge());
  }

  updateEdgePositions(id: NodeId) {
    const edges = this.edges.filter(
      (edge) => edge.startNode.id === id || edge.endNode.id === id
    );

    edges.forEach((edge) => {
      edge.updatePosition();
    });
  }

  getNodes() {
    return this.nodes;
  }

  getEdges() {
    return this.edges;
  }

  clearHighlights() {
    this.nodes.forEach((n) => n.setHighlight(false));
    this.edges.forEach((e) => e.setHighlight(false));
  }
}

export default NetworkGraph;
