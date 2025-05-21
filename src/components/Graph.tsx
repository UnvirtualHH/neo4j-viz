import { Viewport } from "pixi-viewport";
import {
  Application,
  Container,
  FederatedPointerEvent,
  PointData,
} from "pixi.js";
import {
  Component,
  createEffect,
  createSignal,
  onCleanup,
  onMount,
  Show,
} from "solid-js";
import NetworkGraph from "../graph/networkgraph";
import Node from "../graph/node";
import { updateNodeProperties } from "../service/cypher";
import { GraphRow, Neo4jId } from "../types/graphdata";
import debounce from "../utils/debounce";
import PropertiesDialog from "./graph/PropertiesDialog";

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

  let isViewportDragging = false;
  let lastPointerPosition: { x: number; y: number } | null = null;

  const [inspectedProps, setInspectedProps] = createSignal<{
    data: Record<string, any>;
    title: string;
    type: "node" | "relationship";
    elementId?: string;
    identity?: Neo4jId;
  } | null>(null);

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
    viewport.pinch().wheel().clampZoom({
      minWidth: 100,
      minHeight: 100,
      maxWidth: 10000,
      maxHeight: 10000,
    });

    pixiApp.stage.hitArea = pixiApp.screen;
    pixiApp.stage.eventMode = "static";

    pixiApp.stage.addChild(viewport);

    canvasRef.addEventListener("pointerdown", (e) => {
      if (dragTarget) return;
      isViewportDragging = true;
      lastPointerPosition = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener("pointermove", (e) => {
      if (!isViewportDragging || !lastPointerPosition) return;

      const dx = e.clientX - lastPointerPosition.x;
      const dy = e.clientY - lastPointerPosition.y;

      viewport.x += dx;
      viewport.y += dy;

      lastPointerPosition = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener("pointerup", onDragEnd);
    window.addEventListener("pointercancel", onDragEnd);
    window.addEventListener("resize", resizeHandler);
  };

  const onDragMove = (event: PointerEvent) => {
    if (!dragTarget) return;

    const newPos = viewport.toLocal({
      x: event.clientX,
      y: event.clientY,
    });
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

    window.addEventListener("pointermove", onDragMove);
  };

  const onDragEnd = () => {
    if (dragTarget) {
      dragTarget.alpha = 1;
      dragTarget.cursor = "pointer";
      dragTarget = null;

      window.removeEventListener("pointermove", onDragMove);
      viewport.pause = false;
    }

    isViewportDragging = false;
    lastPointerPosition = null;
  };

  // TODO: outsource?
  const buildGraphFromData = () => {
    if (!viewport) return;

    graph?.destroy?.();
    graph = new NetworkGraph();
    const nodeMap = new Map<string, Node>();

    for (const { sourceNode, relation, targetNode } of props.data) {
      if (!sourceNode?.identity) continue;

      const sourceId =
        sourceNode.elementId ?? sourceNode.identity.low.toString();

      if (!nodeMap.has(sourceId)) {
        const node = new Node({
          id: sourceId,
          position: {
            x: Math.random() * pixiApp.screen.width,
            y: Math.random() * pixiApp.screen.height,
          },
          radius: 20,
          color: 0x3498db,
          label: sourceNode.properties.name ?? sourceId,
          onDragStart,
          onClick: () => {
            setInspectedProps({
              data: sourceNode.properties,
              title: sourceNode.labels?.join(", ") || "Node",
              type: "node",
              elementId: sourceNode.elementId,
              identity: sourceNode.identity,
            });
          },
        });

        graph.addNode(node);
        nodeMap.set(sourceId, node);

        graph.startSimulation();
      }

      if (targetNode?.identity && relation) {
        const targetId =
          targetNode.elementId ?? targetNode.identity.low.toString();

        if (!nodeMap.has(targetId)) {
          const node = new Node({
            id: targetId,
            position: {
              x: Math.random() * pixiApp.screen.width,
              y: Math.random() * pixiApp.screen.height,
            },
            radius: 20,
            color: 0xe67e22,
            label: targetNode.properties.name ?? targetId,
            onDragStart,
            onClick: () => {
              setInspectedProps({
                data: targetNode.properties,
                title: targetNode.labels?.join(", ") || "Node",
                type: "node",
                elementId: targetNode.elementId,
                identity: targetNode.identity,
              });
            },
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
          data: relation,
          onClick: () => {
            setInspectedProps({
              data: relation.properties,
              title: relation.type,
              // title: relation.labels?.join(", ") || "Relationship",
              type: "relationship",
              elementId: undefined,
              identity: undefined,
            });
          },
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
    window.removeEventListener("pointerup", onDragEnd);
    window.removeEventListener("pointercancel", onDragEnd);
  });

  return (
    <>
      <canvas class="w-dvw h-dvh bg-slate-200" ref={canvasRef} />
      <Show when={inspectedProps()} keyed>
        {(inspected) => (
          <PropertiesDialog
            data={inspected.data}
            title={inspected.title}
            type={inspected.type}
            elementId={inspected.elementId}
            identity={inspected.identity}
            onClose={() => setInspectedProps(null)}
            onUpdateAll={(newData) => {
              if (inspected.elementId) {
                updateNodeProperties(inspected.elementId, newData);
              }
            }}
          />
        )}
      </Show>
    </>
  );
};

export default Graph;
