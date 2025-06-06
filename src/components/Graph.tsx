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
import { ForceGraphLayout } from "../graph/layout/forcelayout";
import { TreeLayout } from "../graph/layout/treelayout";
import NetworkGraph from "../graph/networkgraph";
import Node from "../graph/node";
import { updateNodeProperties } from "../service/cypher";
import { useSetting } from "../store/settings";
import { GraphRow, Neo4jId } from "../types/graphdata";
import debounce from "../utils/debounce";
import LayoutSwitcher, { LayoutType } from "./graph/LayoutSwitcher";
import createMinimap from "./graph/minimap";
import PropertiesDialog from "./graph/PropertiesDialog";
import ZoomControl from "./graph/ZoomControl";
import Search from "./search/Search";
import { RadialLayout } from "../graph/layout/radiallayout";
import ExportControl from "./graph/ExportControl";

const Graph: Component<{ data: GraphRow[] }> = (props) => {
  const [selectedLayout, setSelectedLayout] = createSignal<LayoutType>("force");
  const [viewportReady, setViewportReady] = createSignal(false);
  const [matchCount, setMatchCount] = createSignal(0);
  const [zoomLevel, setZoomLevel] = createSignal(1);
  let canvasRef!: HTMLCanvasElement;
  const pixiApp = new Application();
  let viewport: Viewport;
  let graph: NetworkGraph;
  let dragTarget: Container | null = null;
  let dragOffset: PointData = { x: 0, y: 0 };

  let isViewportDragging = false;
  let lastPointerPosition: { x: number; y: number } | null = null;

  let minimap: ReturnType<typeof createMinimap>;

  const zoomSetting = useSetting("requireCtrlForZoom");

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
      backgroundColor: 0x888888,
      width: canvasRef.clientWidth,
      height: canvasRef.clientHeight,
      antialias: true,
    });

    viewport = new Viewport({ events: pixiApp.renderer.events });
    viewport.pinch().clampZoom({
      minWidth: 100,
      minHeight: 100,
      maxWidth: 10000,
      maxHeight: 10000,
    });

    canvasRef.addEventListener("wheel", (e) => {
      const requireCtrl = zoomSetting.get();
      const ctrlHeld = e.ctrlKey || e.metaKey;

      if (!requireCtrl || (requireCtrl && ctrlHeld)) {
        e.preventDefault();

        const scaleFactor = 1.1;
        const zoomIn = e.deltaY < 0;

        const currentZoom = viewport.scale.x;
        const newScale = zoomIn
          ? Math.min(currentZoom * scaleFactor, 10)
          : Math.max(currentZoom / scaleFactor, 0.1);

        setZoomTo(newScale);
      }
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

    setViewportReady(true);
  };

  const onDragMove = (event: PointerEvent) => {
    if (!dragTarget) return;
    const newPos = viewport.toLocal({ x: event.clientX, y: event.clientY });
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

  const buildGraphFromData = () => {
    if (!viewport) return;

    graph?.destroy?.();
    graph = new NetworkGraph();

    if (selectedLayout() === "force") {
      graph.setLayoutStrategy(new ForceGraphLayout());
    } else if (selectedLayout() === "radial") {
      graph.setLayoutStrategy(new RadialLayout());
    } else if (selectedLayout() === "tree") {
      graph.setLayoutStrategy(new TreeLayout());
    }

    const nodeMap = new Map<string, Node>();

    for (const { sourceNode, relation, targetNode } of props.data) {
      if (!sourceNode?.identity) continue;
      const sourceId =
        sourceNode.elementId ?? sourceNode.identity.low.toString();

      if (!nodeMap.has(sourceId)) {
        const label = sourceNode.labels?.[0] ?? sourceId;
        const node = new Node({
          id: sourceId,
          position: {
            x: Math.random() * pixiApp.screen.width,
            y: Math.random() * pixiApp.screen.height,
          },
          radius: 20,
          color: stringToColor(label),
          label: sourceNode.labels[0] ?? sourceId,
          labels: sourceNode.labels,
          properties: sourceNode.properties,
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
      }

      if (targetNode?.identity && relation) {
        const targetId =
          targetNode.elementId ?? targetNode.identity.low.toString();

        if (!nodeMap.has(targetId)) {
          const label = targetNode.labels?.[0] ?? sourceId;
          const node = new Node({
            id: targetId,
            position: {
              x: Math.random() * pixiApp.screen.width,
              y: Math.random() * pixiApp.screen.height,
            },
            radius: 20,
            color: stringToColor(label),
            label: targetNode.labels[0] ?? targetId,
            labels: targetNode.labels,
            properties: targetNode.properties,
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

        const relationId =
          relation.elementId ?? relation.identity.low.toString();

        graph.addEdge({
          id: relationId,
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
              type: "relationship",
              elementId: relation.elementId,
              identity: relation.identity,
            });
          },
        });
      }
    }

    viewport.removeChildren();
    viewport.addChild(graph);
    graph.startSimulation();
    minimap = createMinimap(pixiApp, viewport, graph);
    viewport.on("moved", minimap.draw);
    viewport.on("zoomed", minimap.draw);
    viewport.on("frame-end", minimap.draw);
    minimap.draw();
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

  function stringToColor(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const color = (hash & 0x00ffffff).toString(16).toUpperCase();
    return parseInt("0x" + color.padStart(6, "0"));
  }

  const handleSearch = (term: string) => {
    if (!graph || !term.trim()) {
      graph?.clearHighlights?.();
      setMatchCount(0);
      return;
    }

    const lower = term.toLowerCase();
    let count = 0;

    graph.getNodes().forEach((node) => {
      const match =
        node.label?.toLowerCase().includes(lower) ||
        Object.values(node.data || {}).some((val) =>
          String(val).toLowerCase().includes(lower)
        );
      node.setHighlight(match);
      if (match) count++;
    });

    graph.getEdges().forEach((edge) => {
      const match =
        edge.caption?.toString().toLowerCase().includes(lower) ||
        Object.values(edge.data || {}).some((val) =>
          String(val).toLowerCase().includes(lower)
        );
      edge.setHighlight(match);
      if (match) count++;
    });

    setMatchCount(count);
  };

  function setZoomTo(scale: number) {
    if (!viewportReady()) return;
    const screenCenter = {
      x: viewport.screenWidth / 2,
      y: viewport.screenHeight / 2,
    };
    const worldCenterBefore = viewport.toWorld(screenCenter.x, screenCenter.y);
    viewport.scale.set(scale);
    const worldCenterAfter = viewport.toWorld(screenCenter.x, screenCenter.y);
    const dx = worldCenterAfter.x - worldCenterBefore.x;
    const dy = worldCenterAfter.y - worldCenterBefore.y;
    viewport.x += dx * viewport.scale.x;
    viewport.y += dy * viewport.scale.y;
    setZoomLevel(scale);
  }

  return (
    <>
      <Search onSearch={handleSearch} matchCount={matchCount()} />
      <canvas class="w-dvw h-dvh bg-slate-200" ref={canvasRef} />

      <Show when={viewportReady()}>
        <div class="absolute bottom-4 right-4 z-20 flex flex-col items-center">
          <ExportControl
            getPixiApp={() => pixiApp}
            getGraph={() => graph}
            getMinimap={() => minimap}
          />
          <ZoomControl
            zoomLevel={zoomLevel}
            minZoom={0.1}
            maxZoom={10}
            onZoomChange={setZoomTo}
          />
        </div>
      </Show>

      <LayoutSwitcher
        selected={selectedLayout()}
        onSelectLayout={setSelectedLayout}
      />
      <Show when={inspectedProps()} keyed>
        {(inspected) => (
          <PropertiesDialog
            data={inspected.data}
            title={inspected.title}
            type={inspected.type}
            elementId={inspected.elementId}
            identity={inspected.identity}
            onClose={() => setInspectedProps(null)}
            onUpdateAll={(updates, toRemove) => {
              if (inspected.elementId) {
                updateNodeProperties(inspected.elementId, updates, toRemove);
              }
            }}
          />
        )}
      </Show>
    </>
  );
};

export default Graph;
