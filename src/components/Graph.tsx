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
    pixiApp.stage.interactive = true;

    // TODO JH: Refactor event handling
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

      pixiApp.stage.on("pointermove", onDragMove);
    };

    const onDragEnd = () => {
      if (!dragTarget) return;

      dragTarget.alpha = 1;
      dragTarget.cursor = "pointer";
      pixiApp.stage.off("pointermove", onDragMove);
    };

    pixiApp.stage.on("pointermove", onDragMove);
    pixiApp.stage.on("pointerup", onDragEnd);

    const graph = new NetworkGraph();
    graph.addNode(
      0,
      new Node({
        x: 250,
        y: 50,
        radius: 20,
        color: 0x6a93b0,
        onDragStart: onDragStart,
      })
    );
    graph.addNode(
      1,
      new Node({
        x: 200,
        y: 200,
        radius: 20,
        color: 0xedab56,
        onDragStart: onDragStart,
      })
    );

    graph.addEdge(0, 1, 0xeeeeee, 1.5, "Edge 0-1");

    pixiApp.stage.addChild(graph);

    window.addEventListener("resize", resizeHandler);
  });

  onCleanup(() => {
    pixiApp.destroy();

    window.removeEventListener("resize", resizeHandler);
  });

  return <canvas class="w-dvw h-dvh bg-slate-200" ref={canvasRef} />;
};

export default Graph;
