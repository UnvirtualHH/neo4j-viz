import { FederatedPointerEvent, Graphics, PointData, Text } from "pixi.js";
import { darkenColor } from "../utils/color";

type NodeId = string | number;
type NodeProperties = {
  id: NodeId;
  position: PointData;
  radius: number;
  color: number;
  label: string;
  onDragStart?: (event: FederatedPointerEvent) => void;
  onClick?: (event: FederatedPointerEvent) => void;
};

class Node extends Graphics {
  id: NodeId;
  radius: number;
  color: number;
  margin: number;
  label: string;
  onClick?: (event: FederatedPointerEvent) => void;

  #highlighted = false;
  #labelText: Text;

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

    this.onClick = properties.onClick;

    let pointerDownTime = 0;
    let pointerDownPos: PointData = { x: 0, y: 0 };

    this.on("pointerdown", (event) => {
      pointerDownTime = performance.now();
      pointerDownPos = event.global.clone();
      setTimeout(() => properties.onDragStart?.(event), 0);
    });

    this.on("pointertap", (event) => {
      properties.onClick?.(event);
    });

    // Label vorbereiten (Text-Objekt behalten für redraw)
    this.#labelText = new Text({
      text: this.label,
      style: {
        fontSize: 12,
        fill: 0xffffff,
        align: "center",
      },
      resolution: 5,
    });
    this.#labelText.anchor.set(0.5);
    this.#labelText.x = 0;
    this.#labelText.y = 0;

    this.redraw();
  }

  redraw() {
    this.clear();

    const strokeColor = this.#highlighted
      ? 0xffff00
      : darkenColor(this.color, 50);
    const strokeWidth = this.#highlighted ? 4 : 2;

    this.circle(0, 0, this.radius);

    this.fill(this.color);

    this.stroke({
      color: strokeColor,
      width: strokeWidth,
    });

    if (this.#labelText.parent !== this) {
      this.addChild(this.#labelText);
    }
  }

  setHighlight(state: boolean) {
    this.#highlighted = state;
    this.redraw();
  }

  isHighlighted(): boolean {
    return this.#highlighted;
  }

  getCenter(): PointData {
    return this.position;
  }

  get data() {
    return {
      label: this.label,
      color: this.color,
    };
  }
}

export default Node;
export type { NodeId, NodeProperties };
