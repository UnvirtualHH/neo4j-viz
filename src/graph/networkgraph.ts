import { Container } from "pixi.js";
import { Data } from "../types/graphdata";
import Edge, { EdgeId, EdgeProperties } from "./edge";
import Node, { NodeId, NodeProperties } from "./node";
import { LayoutStrategy } from "./layout/layoutstrategy";
import { ForceGraphLayout } from "./layout/forcelayout";

class NetworkGraph extends Container {
  private nodes: Node[] = [];
  private edges: Edge<Data>[] = [];
  private nodeMap = new Map<NodeId, Node>();
  private edgeMap = new Map<EdgeId, Edge<Data>>();

  private animate = false;
  private layoutStrategy: LayoutStrategy = new ForceGraphLayout();

  constructor() {
    super();
  }

  setLayoutStrategy(strategy: LayoutStrategy) {
    this.layoutStrategy = strategy;
  }

  addNode(properties: NodeProperties) {
    if (this.nodeMap.has(properties.id)) return;

    const node = new Node(properties);
    this.nodes.push(node);
    this.nodeMap.set(properties.id, node);
    this.addChild(node);
  }

  addEdge<T extends Data>(
    properties: Omit<EdgeProperties<T>, "startNode" | "endNode"> & {
      startId: NodeId;
      endId: NodeId;
    }
  ) {
    const { id, startId, endId } = properties;

    if (this.edgeMap.has(id)) {
      return;
    }

    const startNode = this.getNodeById(startId);
    const endNode = this.getNodeById(endId);

    if (!startNode || !endNode) {
      throw new Error("Invalid node IDs for edge");
    }

    const edge = new Edge<T>({
      ...properties,
      startNode,
      endNode,
    });

    this.edges.push(edge as unknown as Edge<Data>);
    this.edgeMap.set(id, edge as unknown as Edge<Data>);
    this.addChild(edge);
  }

  getNodeById(id: NodeId): Node | undefined {
    return this.nodeMap.get(id);
  }

  getNodes() {
    return this.nodes;
  }

  getEdges() {
    return this.edges;
  }

  updateEdges() {
    this.edges.forEach((edge) => edge.drawEdge());
  }

  updateEdgePositions(id: NodeId) {
    const edges = this.edges.filter(
      (edge) => edge.startNode.id === id || edge.endNode.id === id
    );
    edges.forEach((edge) => edge.updatePosition());
  }

  clearHighlights() {
    this.nodes.forEach((n) => n.setHighlight(false));
    this.edges.forEach((e) => e.setHighlight(false));
  }

  destroyGraph() {
    this.nodes.forEach((n) => n.destroy());
    this.edges.forEach((e) => e.destroy());
    this.removeChildren();
    this.nodes = [];
    this.edges = [];
    this.nodeMap.clear();
    this.edgeMap.clear();
  }

  startSimulation() {
    if (this.animate) return;
    this.animate = true;

    const radius = 400;
    const step = (2 * Math.PI) / this.nodes.length;
    this.nodes.forEach((node, i) => {
      node.position.x = radius * Math.cos(i * step);
      node.position.y = radius * Math.sin(i * step);
      node.vx = 0;
      node.vy = 0;
    });

    let frameCount = 0;
    const maxFrames = 500;
    const velocityThreshold = 0.1;
    const damping = 0.85;

    const loop = () => {
      if (!this.animate) return;

      frameCount++;

      this.layoutStrategy?.apply(this.nodes, this.edges);

      this.nodes.forEach((node) => {
        const velX = (node.vx / node.mass) * damping;
        const velY = (node.vy / node.mass) * damping;

        node.position.x += velX;
        node.position.y += velY;

        node.vx *= damping;
        node.vy *= damping;
      });

      this.updateEdges();

      const allStable = this.nodes.every((node) => {
        const speed = Math.sqrt(node.vx ** 2 + node.vy ** 2);
        return speed < velocityThreshold;
      });

      if (allStable || frameCount > maxFrames) {
        this.animate = false;
      } else {
        loop();
      }
    };

    loop();
  }
}

export default NetworkGraph;
