import {
  Container,
  FederatedPointerEvent,
  Graphics,
  PointData,
  Text,
} from "pixi.js";
import { darkenColor } from "../utils/color";
import { getMidPoint, getOffsetPoint, getUnitVector } from "../utils/vector";

type Data = {
  [key: string]: any;
};

type NodeId = string | number;
type NodeProperties = {
  id: NodeId;
  position: PointData;
  radius: number;
  color: number;
  label: string;
  onDragStart?: (event: FederatedPointerEvent) => void;
};

type EdgeProperties<T extends Data> = {
  startNode: Node;
  endNode: Node;
  color: number;
  thickness: number;
  caption: keyof T;
  data: T;
};

class Node extends Graphics {
  id: NodeId;
  radius: number;
  color: number;
  margin: number;
  label: string;

  constructor(properties: NodeProperties) {
    super();
    this.id = properties.id;
    this.position = properties.position;
    this.radius = properties.radius;
    this.color = properties.color;
    this.margin = 5;
    this.label = properties.label || "";

    this.eventMode = "static";
    this.cursor = "pointer";

    this.on(
      "pointerdown",
      (event) => {
        properties.onDragStart?.(event);
      },
      this
    );

    this.circle(0, 0, this.radius)
      .fill(this.color)
      .stroke({
        color: darkenColor(this.color, 50),
        width: 2,
      });

    const labelText = new Text({
      text: this.label,
      style: {
        fontSize: 12,
        fill: 0xffffff,
        align: "center",
      },
      resolution: 2,
    });

    labelText.anchor.set(0.5);
    labelText.x = 0;
    labelText.y = 0;

    this.addChild(labelText);
  }

  getCenter(): PointData {
    return this.position;
  }
}

class Edge<T extends Data = Data> extends Graphics {
  startNode: Node;
  endNode: Node;
  color: number;
  thickness: number;
  tipLength: number;
  tipWidth: number;
  caption: keyof T;
  data: T;
  text: Text;

  constructor(properties: EdgeProperties<T>) {
    super();

    this.startNode = properties.startNode;
    this.endNode = properties.endNode;
    this.color = properties.color;
    this.thickness = properties.thickness;
    this.tipLength = properties.thickness * 6;
    this.tipWidth = properties.thickness * 6;
    this.caption = properties.caption;
    this.data = properties.data;
    this.text = new Text({
      text: this.data[this.caption],
      style: { fontSize: 12, fill: this.color },
      resolution: 5,
    });

    this.drawEdge();
  }

  drawLine() {
    const start = this.startNode.getCenter();
    const end = this.endNode.getCenter();

    const { ux, uy } = getUnitVector(start, end);

    const { x: x1, y: y1 } = getOffsetPoint(
      start,
      ux,
      uy,
      this.startNode.radius + this.startNode.margin + this.tipLength
    );

    const { x: x2, y: y2 } = getOffsetPoint(
      end,
      ux,
      uy,
      -(this.endNode.radius + this.endNode.margin + this.tipLength)
    );

    const { x: cx, y: cy } = getMidPoint({ x: x1, y: y1 }, { x: x2, y: y2 });

    let clipLength = 0;
    if (this.text && this.text.text) {
      const padding = 4;
      const textLength = this.text.width + padding * 2;
      clipLength = textLength / 2;
    }

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

    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const angle = Math.atan2(dy, dx);

    const { ux, uy } = getUnitVector(start, end);
    const offset = this.endNode.radius + this.endNode.margin;
    const { x: tipX, y: tipY } = getOffsetPoint(end, ux, uy, -offset);

    const leftX =
      tipX -
      this.tipLength * Math.cos(angle) +
      (this.tipWidth * Math.sin(angle)) / 2;
    const leftY =
      tipY -
      this.tipLength * Math.sin(angle) -
      (this.tipWidth * Math.cos(angle)) / 2;
    const rightX =
      tipX -
      this.tipLength * Math.cos(angle) -
      (this.tipWidth * Math.sin(angle)) / 2;
    const rightY =
      tipY -
      this.tipLength * Math.sin(angle) +
      (this.tipWidth * Math.cos(angle)) / 2;

    this.moveTo(tipX, tipY)
      .lineTo(leftX, leftY)
      .lineTo(rightX, rightY)
      .lineTo(tipX, tipY)
      .fill(this.color);
  }

  drawText() {
    const start = this.startNode.getCenter();
    const end = this.endNode.getCenter();

    const { x: midX, y: midY } = getMidPoint(start, end);

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
    this.drawEdge();
  }
}

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
}

export { Edge, NetworkGraph, Node };
