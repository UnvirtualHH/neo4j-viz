type Anchor =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"
  | "center"
  | "top-center"
  | "bottom-center"
  | "center-left"
  | "center-right";

export function autoDockPosition(
  anchor: Anchor = "top-left",
  options: { padding?: number; width?: number; height?: number } = {}
): { x: number; y: number } {
  const { padding = 20, width = 340, height = 300 } = options;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  switch (anchor) {
    case "top-left":
      return { x: padding, y: padding };
    case "top-right":
      return { x: vw - width - padding, y: padding };
    case "bottom-left":
      return { x: padding, y: vh - height - padding };
    case "bottom-right":
      return { x: vw - width - padding, y: vh - height - padding };
    case "top-center":
      return { x: (vw - width) / 2, y: padding };
    case "bottom-center":
      return { x: (vw - width) / 2, y: vh - height - padding };
    case "center-left":
      return { x: padding, y: (vh - height) / 2 };
    case "center-right":
      return { x: vw - width - padding, y: (vh - height) / 2 };
    case "center":
    default:
      return { x: (vw - width) / 2, y: (vh - height) / 2 };
  }
}
