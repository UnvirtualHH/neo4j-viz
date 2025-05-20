import { createSignal, onCleanup, onMount, type Component } from "solid-js";
import FloatingDialog from "../dialog/FloatingDialog";
import { autoDockPosition } from "../dialog/autoDockPosition";

type PropertiesDialogProps = {
  data: Record<string, any>;
  title?: string;
  type?: "node" | "relationship";
  onClose: () => void;
};

const PropertiesDialog: Component<PropertiesDialogProps> = (props) => {
  const [position, setPosition] = createSignal({ x: 120, y: 100 });
  const [dragging, setDragging] = createSignal(false);
  let dragOffset = { x: 0, y: 0 };

  const onMouseDown = (e: MouseEvent) => {
    setDragging(true);
    dragOffset = {
      x: e.clientX - position().x,
      y: e.clientY - position().y,
    };
  };

  const onMouseMove = (e: MouseEvent) => {
    if (!dragging()) return;
    setPosition({
      x: e.clientX - dragOffset.x,
      y: e.clientY - dragOffset.y,
    });
  };

  const onMouseUp = () => setDragging(false);

  onMount(() => {
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  });

  onCleanup(() => {
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
  });

  return (
    <FloatingDialog
      title={props.title || (props.type === "node" ? "Node" : "Relation")}
      initialPosition={autoDockPosition("top-left", { width: 400 })}
      initialSize={{ width: 340, height: 300 }}
      draggable
      resizable
      closable
      onClose={props.onClose}
    >
      <div class="overflow-y-auto text-sm text-gray-800 space-y-2">
        {Object.keys(props.data).length === 0 ? (
          <p class="text-gray-500 italic">Keine Properties vorhanden</p>
        ) : (
          <ul>
            {Object.entries(props.data).map(([key, value]) => (
              <li class="flex justify-between gap-2 border-b border-gray-200 pb-1">
                <span class="font-mono text-gray-500">{key}</span>
                <span class="truncate text-right">{String(value)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </FloatingDialog>
  );
};

export default PropertiesDialog;
