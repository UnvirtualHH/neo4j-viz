import { Minus, Plus } from "lucide-solid";
import {
  For,
  Show,
  createEffect,
  createSignal,
  type Component,
} from "solid-js";
import { deleteByElementId } from "../../service/cypher";
import { Neo4jId } from "../../types/graphdata";
import ConfirmDialog from "../dialog/ConfirmDialog";
import FloatingDialog from "../dialog/FloatingDialog";
import { autoDockPosition } from "../dialog/autoDockPosition";
import AddPropertyForm from "./AddProperty";
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
  const [showConfirm, setShowConfirm] = createSignal(false);
  let lastExternalData = props.data;
  const [showAddProp, setShowAddProp] = createSignal(false);

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
      initialPosition={autoDockPosition("top-left", { width: 490 })}
      initialSize={{ width: 490, height: 400 }}
      draggable
      resizable
      closable
      minimizable
      onClose={props.onClose}
    >
      <div class="overflow-y-auto text-sm space-y-2 px-2 pb-2 text-white">
        <div class="flex justify-between items-center mb-1">
          <h2 class="text-sm font-semibold">Eigenschaften</h2>
          <button
            title={
              showAddProp()
                ? "Property-Formular schließen"
                : "Property hinzufügen"
            }
            class={`p-1 rounded transition 
    ${
      showAddProp()
        ? "text-red-600 bg-white hover:bg-red-600 hover:text-white"
        : "text-green-600 bg-white hover:bg-green-600 hover:text-white"
    }`}
            onClick={() => setShowAddProp((v) => !v)}
          >
            {showAddProp() ? <Minus size={16} /> : <Plus size={16} />}
          </button>
        </div>
        <Show when={showAddProp()}>
          <AddPropertyForm
            existingKeys={Object.keys(localData())}
            onAdd={(k, v) => {
              setLocalData((prev) => ({ ...prev, [k]: v }));
              setShowAddProp(false);
            }}
          />
        </Show>

        <ul class="space-y-1">
          <Show when={props.elementId}>
            <EditableProp
              keyName="elementId"
              value={props.elementId}
              onChange={() => {}}
              readonly
              onCopy={() => navigator.clipboard.writeText(props.elementId!)}
            />
          </Show>
          <Show when={props.identity}>
            <EditableProp
              keyName="id"
              value={props.identity?.low}
              onChange={() => {}}
              readonly
              onCopy={() =>
                navigator.clipboard.writeText(props.identity!.low?.toString())
              }
            />
          </Show>

          <Show
            when={Object.keys(localData()).length > 0}
            fallback={
              <p class="italic py-4 text-sm">Keine Properties vorhanden</p>
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
      </div>
      <div class="fixed bottom-0 left-0 right-0 p-2 border-t border-t-white flex justify-between items-center">
        <button
          class="px-3 py-1 text-sm rounded bg-red-100 text-red-700 hover:bg-red-200"
          onClick={() => setShowConfirm(true)}
        >
          Löschen
        </button>

        <div class="flex gap-2">
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

      <Show when={showConfirm()}>
        <ConfirmDialog
          message="Willst du dieses Element wirklich löschen?"
          onCancel={() => setShowConfirm(false)}
          onConfirm={async () => {
            try {
              await deleteByElementId(props.type, props.elementId!);
              setShowConfirm(false);
              props.onClose();
            } catch (err) {
              console.error("Fehler beim Löschen:", err);
              alert("Löschen fehlgeschlagen");
            }
          }}
        />
      </Show>
    </FloatingDialog>
  );
};

export default PropertiesDialog;
