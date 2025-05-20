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

export default Node;
export type { NodeId, NodeProperties };
