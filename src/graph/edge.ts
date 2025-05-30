import { Circle, FederatedPointerEvent, Graphics, Text } from "pixi.js";
import { Data } from "../types/graphdata";
import { getMidPoint, getOffsetPoint, getUnitVector } from "../utils/vector";
import Node from "./node";

export type EdgeId = string | number;

type EdgeProperties<T extends Data> = {
  id: EdgeId;
  startNode: Node;
  endNode: Node;
  color: number;
  thickness: number;
  caption: keyof T;
  data: T;
  onClick?: (event: FederatedPointerEvent) => void;
};

class Edge<T extends Data = Data> extends Graphics {
  id: EdgeId;
  startNode: Node;
  endNode: Node;
  color: number;
  thickness: number;
  tipLength: number;
  tipWidth: number;
  caption: keyof T;
  data: T;
  text: Text;
  onClick?: (event: FederatedPointerEvent) => void;

  #highlighted = false;
  #baseColor: number;
  #baseThickness: number;

  constructor(properties: EdgeProperties<T>) {
    super();
    this.id = properties.id;
    this.startNode = properties.startNode;
    this.endNode = properties.endNode;
    this.color = properties.color;
    this.#baseColor = properties.color;
    this.thickness = properties.thickness;
    this.#baseThickness = properties.thickness;
    this.tipLength = this.thickness * 6;
    this.tipWidth = this.thickness * 6;
    this.caption = properties.caption;
    this.data = properties.data;
    this.onClick = properties.onClick;

    this.text = new Text({
      text: String(this.data[this.caption]),
      style: { fontSize: 12, fill: this.color },
      resolution: 5,
    });

    this.eventMode = "static";
    this.cursor = "pointer";

    this.on("pointertap", (event) => {
      this.onClick?.(event);
    });

    this.drawHitbox();

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
    this.text.rotation =
      angle > Math.PI / 2 || angle < -Math.PI / 2 ? angle + Math.PI : angle;

    if (!this.text.parent) this.addChild(this.text);
  }

  drawEdge() {
    this.clear();
    this.drawLine();
    this.drawTip();
    this.drawText();
    this.drawHitbox();
  }

  drawHitbox() {
    const start = this.startNode.getCenter();
    const end = this.endNode.getCenter();
    this.hitArea = new Circle((start.x + end.x) / 2, (start.y + end.y) / 2, 10);
  }

  updatePosition() {
    this.drawEdge();
  }

  setHighlight(state: boolean) {
    this.#highlighted = state;

    this.color = state ? 0xffff00 : this.#baseColor;
    this.thickness = state ? this.#baseThickness * 1.5 : this.#baseThickness;

    this.text.style.fill = this.color;
    this.drawEdge();
  }

  isHighlighted(): boolean {
    return this.#highlighted;
  }
}

export default Edge;
export type { EdgeProperties };
