import {
  createSignal,
  JSX,
  onCleanup,
  onMount,
  Show,
  type Component,
} from "solid-js";
import { Maximize2, Minimize2, X } from "lucide-solid";

import "./FloatingDialog.css";

type FloatingDialogProps = {
  title: string;
  initialPosition?: { x: number; y: number };
  initialSize?: { width: number; height: number };
  closable?: boolean;
  resizable?: boolean;
  minimizable?: boolean;
  draggable?: boolean;
  onClose?: () => void;
  children: JSX.Element;
  class?: string;
};

const FloatingDialog: Component<FloatingDialogProps> = (props) => {
  const [position, setPosition] = createSignal(
    props.initialPosition ?? { x: 100, y: 100 }
  );
  const [size, setSize] = createSignal(
    props.initialSize ?? { width: 340, height: 300 }
  );
  const [dragging, setDragging] = createSignal(false);
  const [resizing, setResizing] = createSignal(false);
  const [minimized, setMinimized] = createSignal(false);

  let dragOffset = { x: 0, y: 0 };
  let resizeStart = { x: 0, y: 0, width: 0, height: 0 };

  const onMouseDownHeader = (e: MouseEvent) => {
    setDragging(true);
    dragOffset = {
      x: e.clientX - position().x,
      y: e.clientY - position().y,
    };
  };

  const onMouseDownResize = (e: MouseEvent) => {
    setResizing(true);
    resizeStart = {
      x: e.clientX,
      y: e.clientY,
      width: size().width,
      height: size().height,
    };
    e.stopPropagation();
  };

  const onMouseMove = (e: MouseEvent) => {
    if (props.draggable && dragging()) {
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      });
    }
    if (props.resizable && resizing()) {
      setSize({
        width: Math.max(200, resizeStart.width + (e.clientX - resizeStart.x)),
        height: Math.max(100, resizeStart.height + (e.clientY - resizeStart.y)),
      });
    }
  };

  const stopAll = () => {
    setDragging(false);
    setResizing(false);
  };

  onMount(() => {
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", stopAll);
  });

  onCleanup(() => {
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", stopAll);
  });

  return (
    <div
      class={`floating-dialog ${props.class ?? ""}`}
      style={{
        top: `${position().y}px`,
        left: `${position().x}px`,
        width: `${size().width}px`,
        height: minimized() ? "auto" : `${size().height}px`,
        position: "absolute",
        "z-index": 2000,
      }}
    >
      <div class="floating-dialog-header" onMouseDown={onMouseDownHeader}>
        <span class="truncate">{props.title}</span>
        <div class="flex gap-1 items-center">
          <Show when={props.minimizable}>
            <button
              class="floating-dialog-minimize"
              onClick={() => setMinimized(!minimized())}
            >
              {minimized() ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
            </button>
          </Show>
          <Show when={props.closable}>
            <button
              class="floating-dialog-close"
              onClick={props.onClose}
              title="Schließen"
            >
              <X size={14} />
            </button>
          </Show>
        </div>
      </div>

      {!minimized() && (
        <div
          class="floating-dialog-body"
          style={{ height: `calc(100% - 2.5rem)` }}
        >
          {props.children}
        </div>
      )}

      {!minimized() && (
        <div
          class="resize-handle"
          onMouseDown={onMouseDownResize}
          title="Größe ändern"
        />
      )}
    </div>
  );
};

export default FloatingDialog;
