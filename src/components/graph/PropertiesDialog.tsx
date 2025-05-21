import {
  Show,
  For,
  createSignal,
  createEffect,
  type Component,
} from "solid-js";
import FloatingDialog from "../dialog/FloatingDialog";
import { autoDockPosition } from "../dialog/autoDockPosition";
import { Neo4jId } from "../../types/graphdata";
import EditableProp from "./EditableProp";

type PropertiesDialogProps = {
  data: Record<string, any>;
  title?: string;
  type?: "node" | "relationship";
  onClose: () => void;
  elementId?: string;
  identity?: Neo4jId;
  onUpdateAll?: (newData: Record<string, any>) => void;
};

const PropertiesDialog: Component<PropertiesDialogProps> = (props) => {
  const [localData, setLocalData] = createSignal({ ...props.data });
  let lastExternalData = props.data;

  createEffect(() => {
    if (props.data !== lastExternalData) {
      lastExternalData = props.data;
      setLocalData({ ...props.data });
    }
  });

  const updateProp = (key: string, val: string) => {
    const parsed =
      val === "true"
        ? true
        : val === "false"
        ? false
        : !isNaN(Number(val))
        ? Number(val)
        : val;
    setLocalData((prev) => ({ ...prev, [key]: parsed }));
  };

  const sortedKeys = () =>
    Object.keys(localData()).sort((a, b) => {
      const order = ["id", "elementId"];
      const aIndex = order.includes(a) ? order.indexOf(a) : 99;
      const bIndex = order.includes(b) ? order.indexOf(b) : 99;
      return aIndex !== bIndex ? aIndex - bIndex : a.localeCompare(b);
    });

  return (
    <FloatingDialog
      title={props.title || (props.type === "node" ? "Node" : "Relation")}
      initialPosition={autoDockPosition("top-left", { width: 400 })}
      initialSize={{ width: 450, height: 360 }}
      draggable
      resizable
      closable
      minimizable
      onClose={props.onClose}
    >
      <div class="overflow-y-auto text-sm text-gray-800 space-y-2 px-2 pb-2">
        <ul class="space-y-1">
          <Show when={props.elementId}>
            <li class="flex justify-between gap-2 border-b border-gray-200 pb-1">
              <span class="font-mono text-gray-500">&lt;elementId&gt;</span>
              <span class="truncate text-right font-mono text-gray-700">
                {props.elementId}
              </span>
            </li>
          </Show>

          <Show when={props.identity}>
            <li class="flex justify-between gap-2 border-b border-gray-200 pb-1">
              <span class="font-mono text-gray-500">&lt;id&gt;</span>
              <span class="truncate text-right font-mono text-gray-700">
                {props.identity?.low}
              </span>
            </li>
          </Show>

          <Show
            when={Object.keys(localData()).length > 0}
            fallback={
              <p class="text-gray-500 italic py-4 text-sm">
                Keine Properties vorhanden
              </p>
            }
          >
            <For each={sortedKeys()}>
              {(key) => (
                <EditableProp
                  keyName={key}
                  value={localData()[key]}
                  onChange={(val) => updateProp(key, val)}
                  onCopy={() =>
                    navigator.clipboard.writeText(
                      `${key}: ${
                        typeof localData()[key] === "string"
                          ? `"${localData()[key]}"`
                          : localData()[key]
                      }`
                    )
                  }
                />
              )}
            </For>
          </Show>
        </ul>

        <div class="flex justify-end gap-2 mt-4 pt-3 border-t border-gray-200">
          <button
            class="px-3 py-1 text-sm rounded bg-gray-100 hover:bg-gray-200"
            onClick={() => setLocalData({ ...props.data })}
          >
            Abbrechen
          </button>
          <button
            class="px-3 py-1 text-sm rounded bg-blue-600 text-white hover:bg-blue-700"
            onClick={() => props.onUpdateAll?.(localData())}
          >
            Speichern
          </button>
        </div>
      </div>
    </FloatingDialog>
  );
};

export default PropertiesDialog;
