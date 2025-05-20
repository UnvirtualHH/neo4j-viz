import { Viewport } from "pixi-viewport";
import {
  Application,
  Container,
  FederatedPointerEvent,
  PointData,
} from "pixi.js";
import { Component, onCleanup, onMount } from "solid-js";
import { NetworkGraph, Node } from "../graph/graph";
import debounce from "../utils/debounce";

const Graph: Component = () => {
  let canvasRef!: HTMLCanvasElement;
  let dragTarget: Container | null = null;
  let dragOffset: PointData = { x: 0, y: 0 };
  const pixiApp = new Application();

  const resizeHandler = debounce(
    () =>
      pixiApp.renderer.resize(canvasRef.clientWidth, canvasRef.clientHeight),
    200
  );

  onMount(async () => {
    await pixiApp.init({
      canvas: canvasRef,
      backgroundColor: 0x444444,
      width: canvasRef.clientWidth,
      height: canvasRef.clientHeight,
      antialias: true,
    });

    pixiApp.stage.hitArea = pixiApp.screen;
    pixiApp.stage.eventMode = "static";

    const viewport = new Viewport({ events: pixiApp.renderer.events });

    viewport.drag().pinch().wheel().clampZoom({
      minWidth: 100,
      minHeight: 100,
      maxWidth: 10000,
      maxHeight: 10000,
    });

    viewport.on("mousedown", () => {
      viewport.cursor = "grabbing";
    });

    viewport.on("mouseup", () => {
      viewport.cursor = "auto";
    });

    pixiApp.stage.addChild(viewport);

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

      viewport.pause = false;

      pixiApp.stage.off("pointermove", onDragMove);
    };

    pixiApp.stage.on("pointermove", onDragMove);
    pixiApp.stage.on("pointerup", onDragEnd);

    const graph = new NetworkGraph();

    for (let i = 0; i < 10; i++) {
      graph.addNode(
        i,
        new Node({
          position: {
            x: Math.random() * pixiApp.screen.width,
            y: Math.random() * pixiApp.screen.height,
          },
          radius: 20,
          color: 0xedab56,
          onDragStart: onDragStart,
        })
      );
    }

    for (let i = 0; i < 10; i++) {
      graph.addEdge(
        Math.floor(Math.random() * 10),
        Math.floor(Math.random() * 10),
        0xdddddd,
        2,
        `Edge ${i}`
      );
    }

    viewport.addChild(graph);

    window.addEventListener("resize", resizeHandler);
  });

  onCleanup(() => {
    pixiApp.destroy();

    window.removeEventListener("resize", resizeHandler);
  });

  return <canvas class="w-dvw h-dvh bg-slate-200" ref={canvasRef} />;
};

export default Graph;
