import { Viewport } from "pixi-viewport";
import {
  Application,
  Container,
  FederatedPointerEvent,
  PointData,
} from "pixi.js";
import { Component, createEffect, onCleanup, onMount } from "solid-js";
import { NetworkGraph, Node } from "../graph/graph";
import { GraphRow } from "../types/graphdata";
import debounce from "../utils/debounce";

type GraphProps = {
  data: GraphRow[];
};

const Graph: Component<GraphProps> = (props) => {
  let canvasRef!: HTMLCanvasElement;
  const pixiApp = new Application();
  let viewport: Viewport;
  let graph: NetworkGraph;
  let dragTarget: Container | null = null;
  let dragOffset: PointData = { x: 0, y: 0 };

  const resizeHandler = debounce(() => {
    pixiApp.renderer.resize(canvasRef.clientWidth, canvasRef.clientHeight);
  }, 200);

  const initPixi = async () => {
    await pixiApp.init({
      canvas: canvasRef,
      backgroundColor: 0x444444,
      width: canvasRef.clientWidth,
      height: canvasRef.clientHeight,
      antialias: true,
    });

    viewport = new Viewport({ events: pixiApp.renderer.events });
    viewport.drag().pinch().wheel().clampZoom({
      minWidth: 100,
      minHeight: 100,
      maxWidth: 10000,
      maxHeight: 10000,
    });

    pixiApp.stage.hitArea = pixiApp.screen;
    pixiApp.stage.eventMode = "static";

    pixiApp.stage.addChild(viewport);
    pixiApp.stage.on("pointerup", onDragEnd);
    window.addEventListener("resize", resizeHandler);
  };

  const onDragMove = (event: FederatedPointerEvent) => {
    if (!dragTarget) return;

    const newPos = event.getLocalPosition(dragTarget.parent);
    dragTarget.position.set(newPos.x - dragOffset.x, newPos.y - dragOffset.y);

    graph.updateEdges();
  };

  const onDragStart = (event: FederatedPointerEvent) => {
    const node = event.currentTarget;

    dragTarget = node;

    node.alpha = 0.5;
    node.cursor = "grabbing";

    const localPos = event.getLocalPosition(node);
    dragOffset.x = localPos.x;
    dragOffset.y = localPos.y;

    viewport.pause = true;

    pixiApp.stage.on("pointermove", onDragMove);
  };

  const onDragEnd = () => {
    if (!dragTarget) return;
    dragTarget.alpha = 1;
    dragTarget.cursor = "pointer";
    dragTarget = null;
    pixiApp.stage.off("pointermove", onDragMove);
  };

  const buildGraphFromData = () => {
    if (!viewport) return;

    graph?.destroy?.();
    graph = new NetworkGraph();
    const nodeMap = new Map<string, Node>();

    for (const row of props.data) {
      const a = row.a;
      const b = row.b;
      const r = row.r;

      if (!a?.identity) continue;

      const sourceId = a.elementId ?? a.identity.low.toString();

      if (!nodeMap.has(sourceId)) {
        const node = new Node({
          id: sourceId,
          position: {
            x: Math.random() * pixiApp.screen.width,
            y: Math.random() * pixiApp.screen.height,
          },
          radius: 20,
          color: 0x3498db,
          label: a.properties.name ?? sourceId,
          onDragStart,
        });

        graph.addNode(node);
        nodeMap.set(sourceId, node);
      }

      if (b?.identity && r) {
        const targetId = b.elementId ?? b.identity.low.toString();

        if (!nodeMap.has(targetId)) {
          const node = new Node({
            id: targetId,
            position: {
              x: Math.random() * pixiApp.screen.width,
              y: Math.random() * pixiApp.screen.height,
            },
            radius: 20,
            color: 0xe67e22,
            label: b.properties.name ?? targetId,
            onDragStart,
          });

          graph.addNode(node);
          nodeMap.set(targetId, node);
        }

        graph.addEdge({
          startId: sourceId,
          endId: targetId,
          color: 0xdddddd,
          thickness: 2,
          caption: "type",
          data: r,
        });
      }
    }

    viewport.removeChildren();
    viewport.addChild(graph);
  };

  onMount(initPixi);

  createEffect(() => {
    if (props.data.length > 0) {
      buildGraphFromData();
    }
  });

  onCleanup(() => {
    pixiApp.destroy(true, { children: true });
    window.removeEventListener("resize", resizeHandler);
  });

  return <canvas class="w-dvw h-dvh bg-slate-200" ref={canvasRef} />;
};

export default Graph;
