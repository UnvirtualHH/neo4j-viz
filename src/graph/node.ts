import { FederatedPointerEvent, Graphics, PointData, Text } from "pixi.js";
import { darkenColor } from "../utils/color";

type NodeId = string | number;

type NodeProperties = {
  id: NodeId;
  position: PointData;
  radius: number;
  color: number;
  label: string;
  properties?: Record<string, any>;
  labels?: string[];
  onDragStart?: (event: FederatedPointerEvent) => void;
  onClick?: (event: FederatedPointerEvent) => void;
};

class Node extends Graphics {
  id: NodeId;
  radius: number;
  color: number;
  margin: number;
  label: string;
  properties: Record<string, any>;
  labels: string[];
  vx: number;
  vy: number;
  mass: number;
  onClick?: (event: FederatedPointerEvent) => void;

  #highlighted = false;
  #labelText: Text;

  constructor(props: NodeProperties) {
    super();
    this.id = props.id;
    this.position.set(props.position.x, props.position.y);
    this.radius = props.radius;
    this.color = props.color;
    this.margin = 5;
    this.label = props.label || "";
    this.properties = props.properties ?? {};
    this.labels = props.labels ?? [];
    this.vx = 0;
    this.vy = 0;
    this.mass = (2 * Math.PI * this.radius) / 1.5;

    this.eventMode = "static";
    this.cursor = "pointer";

    this.onClick = props.onClick;

    this.on("pointerdown", (event) => {
      setTimeout(() => props.onDragStart?.(event), 0);
    });

    this.on("pointertap", (event) => {
      props.onClick?.(event);
    });

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
      ...this.properties,
      labels: this.labels.join(", "),
    };
  }
}

export default Node;
export type { NodeId, NodeProperties };
