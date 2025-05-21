import { Container } from "pixi.js";
import { Data } from "../types/graphdata";
import Edge, { EdgeProperties } from "./edge";
import Node, { NodeId, NodeProperties } from "./node";

class NetworkGraph extends Container {
  nodes: Node[] = [];
  edges: Edge<Data>[] = [];

  constructor() {
    super();
  }

  addNode(properties: NodeProperties) {
    const node = new Node(properties);
    this.nodes.push(node);
    this.addChild(node);
  }

  addEdge<T extends Data>(
    properties: Omit<EdgeProperties<T>, "startNode" | "endNode"> & {
      startId: NodeId;
      endId: NodeId;
    }
  ) {
    const startNode = this.nodes.find((node) => node.id === properties.startId);
    const endNode = this.nodes.find((node) => node.id === properties.endId);
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

  /*
function applyForces(nodes) {

  // apply force towards centre
  nodes.forEach(node => {
    gravity = node.pos.copy().mult(-1).mult(gravityConstant)
    node.force = gravity
  })

  // apply repulsive force between nodes
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      pos = nodes[i].pos
      dir = nodes[j].pos.copy().sub(pos)
      force = dir.div(dir.mag() * dir.mag())
      force.mult(forceConstant)
      nodes[i].force.add(force.copy().mult(-1))
      nodes[j].force.add(force)
    }
  }

  // apply forces applied by connections
  nodeCon.forEach(con => {
    let node1 = nodes[con[0]]
    let node2 = nodes[con[1]]
    let maxDis = con[2]
    let dis = node1.pos.copy().sub(node2.pos)
    diff = dis.mag() - maxDis
    node1.force.sub(dis)
    node2.force.add(dis)
  })
}
  */

  private gravityConstant = 1.1;
  private forceConstant = 1000;

  private animate = false;

  applyForces() {
    this.nodes.forEach((node) => {
      node.vx = node.position.x * -1 * this.gravityConstant;
      node.vy = node.position.y * -1 * this.gravityConstant;
    });

    for (let i = 0; i < this.nodes.length; i++) {
      for (let j = i + 1; j < this.nodes.length; j++) {
        const x1 = this.nodes[i].position.x;
        const y1 = this.nodes[i].position.y;
        const x2 = this.nodes[j].position.x;
        const y2 = this.nodes[j].position.y;

        const dirX = x2 - x1;
        const dirY = y2 - y1;

        const distSq = dirX * dirX + dirY * dirY;
        if (distSq === 0) continue;

        const factor = this.forceConstant / distSq;

        const forceX = dirX * factor;
        const forceY = dirY * factor;

        this.nodes[i].vx -= forceX;
        this.nodes[i].vy -= forceY;

        this.nodes[j].vx += forceX;
        this.nodes[j].vy += forceY;
      }
    }
  }

  startSimulation() {
    if (this.animate) return;
    this.animate = true;

    const loop = () => {
      if (!this.animate) return;

      this.applyForces();
      this.nodes.forEach((node) => {
        const velX = node.vx / node.mass;
        const velY = node.vy / node.mass;

        node.position.x += velX;
        node.position.y += velY;
      });
      this.updateEdges();

      if (this.nodes.every((node) => node.vx > -10 && node.vy > -10))
        this.animate = false;

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }
}

export default NetworkGraph;
