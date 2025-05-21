import { type Component } from "solid-js";
import FloatingDialog from "../dialog/FloatingDialog";
import { autoDockPosition } from "../dialog/autoDockPosition";

type PropertiesDialogProps = {
  data: Record<string, any>;
  title?: string;
  type?: "node" | "relationship";
  onClose: () => void;
};

const PropertiesDialog: Component<PropertiesDialogProps> = (props) => {
  return (
    <FloatingDialog
      title={props.title || (props.type === "node" ? "Node" : "Relation")}
      initialPosition={autoDockPosition("top-left", {
        width: 400,
      })}
      initialSize={{ width: 340, height: 300 }}
      draggable
      resizable
      closable
      minimizable
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
