import {
  Container,
  FederatedPointerEvent,
  Graphics,
  PointData,
  Text,
} from "pixi.js";

// TODO JH: Clean up

type NodeId = string | number;
type NodeProperties = {
  x: number;
  y: number;
  radius: number;
  color: number;
  props?: [key: string];
  onDragStart?: (event: FederatedPointerEvent) => void;
};

class Node extends Graphics {
  props?: [key: string];

  constructor(properties: NodeProperties) {
    super();
    this.x = properties.x;
    this.y = properties.y;
    this.props = properties.props;

    this.eventMode = "static";
    this.cursor = "pointer";

    this.on(
      "pointerdown",
      (event) => {
        properties.onDragStart?.(event);
      },
      this
    );

    this.circle(0, 0, properties.radius)
      .fill(properties.color)
      .stroke({
        color: darkenColor(properties.color, 50),
        width: 2,
      });
  }

  getCenter(): PointData {
    return this.position;
  }
}

class Edge extends Graphics {
  startNode: Node;
  endNode: Node;
  color: number;
  thickness: number;
  text: Text;

  constructor(
    startNode: Node,
    endNode: Node,
    color: number,
    thickness: number,
    text: string
  ) {
    super();

    this.startNode = startNode;
    this.endNode = endNode;
    this.color = color;
    this.thickness = thickness;
    this.text = new Text({
      text: text,
      style: { fontSize: 12, fill: 0x000000 },
    });

    this.drawEdge();
  }

  drawLine() {
    const start = this.startNode.getCenter();
    const end = this.endNode.getCenter();

    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    let clipLength = 0;
    if (this.text && this.text.text) {
      const padding = 4;
      const textLength = this.text.width + padding * 2;
      clipLength = textLength / 2;
    }

    const ux = dx / distance;
    const uy = dy / distance;

    const x1 = start.x;
    const y1 = start.y;
    const x2 = end.x;
    const y2 = end.y;

    const cx = (x1 + x2) / 2;
    const cy = (y1 + y2) / 2;

    const clipStartX = cx - ux * clipLength;
    const clipStartY = cy - uy * clipLength;
    const clipEndX = cx + ux * clipLength;
    const clipEndY = cy + uy * clipLength;

    this.moveTo(x1, y1)
      .lineTo(clipStartX, clipStartY)
      .stroke({ color: this.color, width: this.thickness });

    this.moveTo(clipEndX, clipEndY)
      .lineTo(x2, y2)
      .stroke({ color: this.color, width: this.thickness });
  }

  drawTip() {
    const start = this.startNode.getCenter();
    const end = this.endNode.getCenter();

    const arrowLength = this.thickness * 5;
    const arrowWidth = this.thickness * 5;

    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const angle = Math.atan2(dy, dx);

    const tipX = end.x;
    const tipY = end.y;
    const leftX =
      tipX - arrowLength * Math.cos(angle) + (arrowWidth * Math.sin(angle)) / 2;
    const leftY =
      tipY - arrowLength * Math.sin(angle) - (arrowWidth * Math.cos(angle)) / 2;
    const rightX =
      tipX - arrowLength * Math.cos(angle) - (arrowWidth * Math.sin(angle)) / 2;
    const rightY =
      tipY - arrowLength * Math.sin(angle) + (arrowWidth * Math.cos(angle)) / 2;

    this.moveTo(tipX, tipY)
      .lineTo(leftX, leftY)
      .lineTo(rightX, rightY)
      .lineTo(tipX, tipY)
      .fill(this.color);
  }

  drawText() {
    const start = this.startNode.getCenter();
    const end = this.endNode.getCenter();

    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;

    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const angle = Math.atan2(dy, dx);

    this.text.x = midX;
    this.text.y = midY;

    this.text.anchor.set(0.5);
    if (angle > Math.PI / 2 || angle < -Math.PI / 2) {
      this.text.rotation = angle + Math.PI;
    } else {
      this.text.rotation = angle;
    }

    this.text.style.fill = this.color;

    if (!this.text.parent) {
      this.addChild(this.text);
    }
  }

  drawEdge() {
    this.clear();
    this.drawLine();
    this.drawTip();
    this.drawText();
  }

  updatePosition() {
    this.clear();
    this.drawEdge();
  }
}

class NetworkGraph extends Container {
  nodes: Map<NodeId, Node> = new Map();
  edges: Edge[] = [];

  constructor() {
    super();
  }

  addNode(id: NodeId, node: Node) {
    this.nodes.set(id, node);
    this.addChild(node);
  }

  addEdge(
    startId: NodeId,
    endId: NodeId,
    color: number,
    width: number,
    text: string
  ) {
    const startNode = this.nodes.get(startId);
    const endNode = this.nodes.get(endId);
    if (!startNode || !endNode) {
      throw new Error("Invalid node IDs for edge");
    }

    const edge = new Edge(startNode, endNode, color, width, text);
    this.edges.push(edge);
    this.addChild(edge);
    console.log(this.children);
  }

  // TODO JH: Add method to update edge positions by nodes
  updateEdges() {
    this.edges.forEach((edge) => edge.updatePosition());
  }
}

export { Edge, NetworkGraph, Node };

function darkenColor(color: number, amount: number): number {
  const r = ((color >> 16) & 0xff) - amount;
  const g = ((color >> 8) & 0xff) - amount;
  const b = (color & 0xff) - amount;
  return (
    ((Math.max(r, 0) << 16) | (Math.max(g, 0) << 8) | Math.max(b, 0)) >>> 0
  );
}
