import { Viewport } from "pixi-viewport";
import {
  Application,
  Container,
  FederatedPointerEvent,
  Graphics,
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
import Search from "./search/Search";
import ZoomControl from "./graph/ZoomControl";
import { ForceGraphLayout } from "../graph/layout/forcelayout";
import { EulerGraphLayout } from "../graph/layout/eulerlayout";
import LayoutSwitcher, { LayoutType } from "./graph/LayoutSwitcher";
import { TreeLayout } from "../graph/layout/treelayout";
import { useSetting } from "../store/settings";

type GraphProps = {
  data: GraphRow[];
};

const Graph: Component<GraphProps> = (props) => {
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

  let minimapContainer: Container;
  let minimapOverlay: Graphics;
  let minimapViewFrame: Graphics;

  const minZoom = 0.1;
  const maxZoom = 10;

  const minimapPadding = 10;
  const minimapSize = 200;

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
      backgroundColor: 0x444444,
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
          ? Math.min(currentZoom * scaleFactor, maxZoom)
          : Math.max(currentZoom / scaleFactor, minZoom);

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

    minimapContainer = new Container();
    minimapOverlay = new Graphics();
    minimapViewFrame = new Graphics();

    minimapOverlay.eventMode = "static";
    minimapOverlay.cursor = "pointer";

    minimapContainer.addChild(minimapOverlay);
    minimapContainer.addChild(minimapViewFrame);

    pixiApp.stage.addChild(minimapContainer);

    minimapOverlay.on("pointerdown", (event) => {
      const local = event.getLocalPosition(minimapOverlay);
      const bounds = getGraphBounds();
      if (!bounds) return;

      const scale = getMinimapScale(bounds);
      const targetX = bounds.minX + (local.x / minimapSize) * bounds.width;
      const targetY = bounds.minY + (local.y / minimapSize) * bounds.height;

      viewport.moveCenter(targetX, targetY);
    });
  };

  function drawMinimap() {
    if (!graph) return;

    const nodes = graph.getNodes();
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

    const screenHeight = pixiApp.screen.height;
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
    minimapOverlay.beginFill(0x1e1e1e, 0.8);
    minimapOverlay.drawRoundedRect(0, 0, minimapSize, minimapSize, 8);
    minimapOverlay.endFill();

    minimapOverlay.beginFill(0x3fa9f5);
    for (const node of nodes) {
      const x = (node.position.x - minX) * scale + offsetX;
      const y = (node.position.y - minY) * scale + offsetY;
      minimapOverlay.drawCircle(x, y, 2);
    }
    minimapOverlay.endFill();

    const view = viewport.getVisibleBounds();
    const vx = (view.x - minX) * scale + offsetX;
    const vy = (view.y - minY) * scale + offsetY;
    const vw = view.width * scale;
    const vh = view.height * scale;

    minimapViewFrame.clear();
    minimapViewFrame.lineStyle(1, 0xffffff, 1);
    minimapViewFrame.drawRect(vx, vy, vw, vh);
  }

  function getGraphBounds() {
    const nodes = graph.getNodes();
    if (nodes.length === 0) return null;

    const xs = nodes.map((n) => n.position.x);
    const ys = nodes.map((n) => n.position.y);

    return {
      minX: Math.min(...xs),
      maxX: Math.max(...xs),
      minY: Math.min(...ys),
      maxY: Math.max(...ys),
      width: Math.max(...xs) - Math.min(...xs),
      height: Math.max(...ys) - Math.min(...ys),
    };
  }

  function getMinimapScale(bounds: { width: number; height: number }) {
    const scaleX = minimapSize / bounds.width;
    const scaleY = minimapSize / bounds.height;
    return Math.min(scaleX, scaleY);
  }

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

    if (selectedLayout() === "force") {
      graph.setLayoutStrategy(new ForceGraphLayout());
    } else if (selectedLayout() === "euler") {
      graph.setLayoutStrategy(new EulerGraphLayout());
    } else if (selectedLayout() === "tree") {
      graph.setLayoutStrategy(new TreeLayout());
    }

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
          const node = new Node({
            id: targetId,
            position: {
              x: Math.random() * pixiApp.screen.width,
              y: Math.random() * pixiApp.screen.height,
            },
            radius: 20,
            color: 0xe67e22,
            label: targetNode.properties.name ?? targetId,
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
              // title: relation.labels?.join(", ") || "Relationship",
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

    viewport.on("moved", drawMinimap);
    viewport.on("zoomed", drawMinimap);
    viewport.on("frame-end", drawMinimap);

    drawMinimap();
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
        <LayoutSwitcher
          selected={selectedLayout()}
          onSelectLayout={(layout) => {
            setSelectedLayout(layout);
            buildGraphFromData();
          }}
        />

        <ZoomControl
          zoomLevel={zoomLevel}
          minZoom={minZoom}
          maxZoom={maxZoom}
          onZoomChange={(z) => setZoomTo(z)}
        />
      </Show>

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
