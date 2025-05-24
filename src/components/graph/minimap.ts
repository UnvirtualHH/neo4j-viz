import { onCleanup, onMount } from "solid-js";
import { Application, Container, Graphics } from "pixi.js";
import { Viewport } from "pixi-viewport";
import NetworkGraph from "../../graph/networkgraph";
import { useSetting } from "../../store/settings";

export default function createMinimap(
  app: Application,
  viewport: Viewport,
  graph: NetworkGraph
) {
  const minimapEnabled = useSetting("enableMinimap");
  if (!minimapEnabled.get())
    return { container: new Container(), draw: () => {} };

  const minimapContainer = new Container();
  const minimapOverlay = new Graphics();
  const minimapViewFrame = new Graphics();

  const minimapSize = 200;
  const minimapPadding = 10;

  let minimapLastFrame: { x: number; y: number; w: number; h: number } | null =
    null;
  let minimapFadeTimeout: ReturnType<typeof setTimeout> | null = null;

  const drawMinimap = () => {
    const nodes = graph.getNodes();
    const edges = graph.getEdges();
    if (nodes.length === 0) return;

    const xs = nodes.map((n) => n.position.x);
    const ys = nodes.map((n) => n.position.y);
    let minX = Math.min(...xs);
    let maxX = Math.max(...xs);
    let minY = Math.min(...ys);
    let maxY = Math.max(...ys);

    const paddingFactor = 0.1;
    const width = maxX - minX || 1;
    const height = maxY - minY || 1;

    minX -= width * paddingFactor;
    maxX += width * paddingFactor;
    minY -= height * paddingFactor;
    maxY += height * paddingFactor;

    const graphWidth = maxX - minX || 1;
    const graphHeight = maxY - minY || 1;

    const screenHeight = app.screen.height;
    minimapContainer.position.set(
      minimapPadding,
      screenHeight - minimapSize - minimapPadding
    );

    const scaleX = minimapSize / graphWidth;
    const scaleY = minimapSize / graphHeight;
    const scale = Math.min(scaleX, scaleY);

    const drawWidth = graphWidth * scale;
    const drawHeight = graphHeight * scale;
    const offsetX = (minimapSize - drawWidth) / 2;
    const offsetY = (minimapSize - drawHeight) / 2;

    minimapOverlay.clear();
    minimapOverlay.beginFill(0x1e1e1e, 0.85);
    minimapOverlay.drawRoundedRect(0, 0, minimapSize, minimapSize, 8);
    minimapOverlay.endFill();

    minimapOverlay.lineStyle(1, 0x888888, 0.4);
    for (const edge of edges) {
      const startNode = graph.getNodeById(edge.startNode.id);
      const endNode = graph.getNodeById(edge.endNode.id);
      if (!startNode || !endNode) continue;

      const x1 = (startNode.position.x - minX) * scale + offsetX;
      const y1 = (startNode.position.y - minY) * scale + offsetY;
      const x2 = (endNode.position.x - minX) * scale + offsetX;
      const y2 = (endNode.position.y - minY) * scale + offsetY;

      minimapOverlay.moveTo(x1, y1);
      minimapOverlay.lineTo(x2, y2);
    }

    for (const node of nodes) {
      const x = (node.position.x - minX) * scale + offsetX;
      const y = (node.position.y - minY) * scale + offsetY;
      minimapOverlay.beginFill(node.color ?? 0x3fa9f5);
      minimapOverlay.drawCircle(x, y, 2);
      minimapOverlay.endFill();
    }

    const view = viewport.getVisibleBounds();
    const vx = Math.max(
      0,
      Math.min((view.x - minX) * scale + offsetX, minimapSize)
    );
    const vy = Math.max(
      0,
      Math.min((view.y - minY) * scale + offsetY, minimapSize)
    );
    const vw = Math.min(view.width * scale, minimapSize - vx);
    const vh = Math.min(view.height * scale, minimapSize - vy);

    const changed =
      !minimapLastFrame ||
      minimapLastFrame.x !== vx ||
      minimapLastFrame.y !== vy ||
      minimapLastFrame.w !== vw ||
      minimapLastFrame.h !== vh;

    if (changed) {
      minimapViewFrame.alpha = 1;
      minimapViewFrame.clear();
      minimapViewFrame.beginFill(0xffff00, 0.1);
      minimapViewFrame.lineStyle(2, 0xffff00, 0.9);
      minimapViewFrame.drawRect(vx, vy, vw, vh);
      minimapViewFrame.endFill();
      minimapLastFrame = { x: vx, y: vy, w: vw, h: vh };

      if (minimapFadeTimeout) clearTimeout(minimapFadeTimeout);
      minimapFadeTimeout = setTimeout(() => {
        app.ticker.add(fadeOut);
      }, 1000);
    }
  };

  let fadeProgress = 1.5;
  const fadeOut = () => {
    fadeProgress -= 0.05;
    if (fadeProgress <= 0) {
      fadeProgress = 1.5;
      minimapViewFrame.alpha = 0;
      app.ticker.remove(fadeOut);
    } else {
      minimapViewFrame.alpha = fadeProgress;
    }
  };

  minimapOverlay.eventMode = "static";
  minimapOverlay.cursor = "pointer";
  minimapOverlay.on("pointerdown", (event) => {
    const local = event.getLocalPosition(minimapOverlay);

    const bounds = graph.getNodes().reduce(
      (acc, node) => {
        acc.minX = Math.min(acc.minX, node.position.x);
        acc.maxX = Math.max(acc.maxX, node.position.x);
        acc.minY = Math.min(acc.minY, node.position.y);
        acc.maxY = Math.max(acc.maxY, node.position.y);
        return acc;
      },
      { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity }
    );

    const targetX =
      bounds.minX + (local.x / minimapSize) * (bounds.maxX - bounds.minX);
    const targetY =
      bounds.minY + (local.y / minimapSize) * (bounds.maxY - bounds.minY);
    viewport.moveCenter(targetX, targetY);
  });

  minimapContainer.addChild(minimapOverlay);
  minimapContainer.addChild(minimapViewFrame);
  app.stage.addChild(minimapContainer);

  viewport.on("moved", drawMinimap);
  viewport.on("zoomed", drawMinimap);
  viewport.on("frame-end", drawMinimap);

  onMount(drawMinimap);

  onCleanup(() => {
    if (minimapFadeTimeout) clearTimeout(minimapFadeTimeout);
    app.ticker.remove(fadeOut);
    viewport.off("moved", drawMinimap);
    viewport.off("zoomed", drawMinimap);
    viewport.off("frame-end", drawMinimap);
    app.stage.removeChild(minimapContainer);
  });

  return {
    container: minimapContainer,
    draw: drawMinimap,
  };
}
