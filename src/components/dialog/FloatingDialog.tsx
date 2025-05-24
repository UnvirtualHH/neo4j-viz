import { EyeOff, Maximize2, Minimize2, X } from "lucide-solid";
import {
  createSignal,
  JSX,
  onCleanup,
  onMount,
  Show,
  type Component,
} from "solid-js";

import { addToTray } from "../../store/dialog";
import "./FloatingDialog.css";

type FloatingDialogProps = {
  title: string;
  initialPosition?: { x: number; y: number };
  initialSize?: { width: number; height: number };
  closable?: boolean;
  resizable?: boolean;
  minimizable?: boolean;
  draggable?: boolean;
  trayable?: boolean;
  onClose?: () => void;
  children: JSX.Element;
  class?: string;
};

const FloatingDialog: Component<FloatingDialogProps> = (props) => {
  const [hiddenToTray, setHiddenToTray] = createSignal(false);
  const [animatingOut, setAnimatingOut] = createSignal(false);
  const [minimized, setMinimized] = createSignal(false);
  const [minimating, setMinimating] = createSignal(false);
  const [position, setPosition] = createSignal(
    props.initialPosition ?? { x: 100, y: 100 }
  );
  const [size, setSize] = createSignal(
    props.initialSize ?? { width: 340, height: 300 }
  );
  const [dragging, setDragging] = createSignal(false);
  const [resizing, setResizing] = createSignal(false);

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

  const minimizeWithAnimation = () => {
    setMinimating(true);
    setTimeout(() => {
      setMinimized(!minimized());
      setMinimating(false);
    }, 200);
  };

  const trayWithAnimation = () => {
    setAnimatingOut(true);
    setTimeout(() => {
      setHiddenToTray(true);
      setAnimatingOut(false);
      addToTray({
        id: props.title,
        title: props.title,
        restore: () => setHiddenToTray(false),
      });
    }, 300);
  };

  return (
    <Show when={!hiddenToTray()}>
      <div
        class={`floating-dialog glass ${props.class ?? ""} 
        ${animatingOut() ? "fade-slide-out" : "fade-slide-in"} 
        ${minimized() ? "minimized" : ""}`}
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
            <Show when={props.trayable}>
              <button
                class="floating-dialog-tray"
                onClick={trayWithAnimation}
                title="Verstecken"
              >
                <EyeOff size={14} />
              </button>
            </Show>
            <Show when={props.minimizable}>
              <button
                class="floating-dialog-minimize"
                onClick={minimizeWithAnimation}
              >
                {minimized() ? (
                  <Maximize2 size={14} />
                ) : (
                  <Minimize2 size={14} />
                )}
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
          <div class="floating-dialog-body">{props.children}</div>
        )}

        {!minimized() && (
          <div
            class="resize-handle"
            onMouseDown={onMouseDownResize}
            title="Größe ändern"
          />
        )}
      </div>
    </Show>
  );
};

export default FloatingDialog;
