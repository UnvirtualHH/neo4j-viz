import { type Component } from "solid-js";
import FloatingDialog from "../dialog/FloatingDialog";
import { autoDockPosition } from "../dialog/autoDockPosition";
import { Neo4jId } from "../../types/graphdata";

type PropertiesDialogProps = {
  data: Record<string, any>;
  title?: string;
  type?: "node" | "relationship";
  onClose: () => void;
  elementId?: string;
  identity?: Neo4jId;
};

const PropertiesDialog: Component<PropertiesDialogProps> = (props) => {
  console.log("Props im PropertiesDialog:", props);
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
            {props.elementId && (
              <li class="flex justify-between gap-2 border-b border-gray-200 pb-1">
                <span class="font-mono text-gray-500">&lt;elementId&gt;</span>
                <span class="truncate text-right">{props.elementId}</span>
              </li>
            )}

            {props.identity && (
              <li class="flex justify-between gap-2 border-b border-gray-200 pb-1">
                <span class="font-mono text-gray-500">&lt;id&gt;</span>
                <span class="truncate text-right">{props.identity.low}</span>
              </li>
            )}

            {[
              ...Object.entries(props.data).sort(([a], [b]) => {
                const order = ["id", "elementId"];
                const aIndex = order.includes(a) ? order.indexOf(a) : 99;
                const bIndex = order.includes(b) ? order.indexOf(b) : 99;

                if (aIndex !== bIndex) return aIndex - bIndex;
                return a.localeCompare(b);
              }),
            ].map(([key, value]) => (
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
