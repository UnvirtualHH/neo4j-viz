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
import { ClipboardCopy, Clock, Divide, Plus, Timer } from "lucide-solid";
import ConfirmDialog from "../dialog/ConfirmDialog";
import { deleteByElementId } from "../../service/cypher";
import { Type, Hash, Check, Calendar } from "lucide-solid";

const neo4jTypes = [
  { value: "string", icon: <Type size={16} />, title: "Text" },
  { value: "boolean", icon: <Check size={16} />, title: "Boolean" },
  { value: "integer", icon: <Hash size={16} />, title: "Integer" },
  { value: "float", icon: <Divide size={16} />, title: "Float" },
  { value: "date", icon: <Calendar size={16} />, title: "Datum" },
  { value: "time", icon: <Clock size={16} />, title: "Zeit" },
  { value: "localTime", icon: <Clock size={16} />, title: "Zeit (lokal)" },
  { value: "dateTime", icon: <Clock size={16} />, title: "Zeitstempel" },
  {
    value: "localDateTime",
    icon: <Clock size={16} />,
    title: "Zeitstempel (lokal)",
  },
  { value: "duration", icon: <Timer size={16} />, title: "Dauer" },
];

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
  const [newKey, setNewKey] = createSignal("");
  const [newValue, setNewValue] = createSignal("");
  const [showTypeDropdown, setShowTypeDropdown] = createSignal(false);

  const [newType, setNewType] = createSignal<
    | "string"
    | "boolean"
    | "integer"
    | "float"
    | "date"
    | "time"
    | "localTime"
    | "dateTime"
    | "localDateTime"
    | "duration"
  >("string");

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
      <div class="overflow-y-auto text-sm text-gray-800 space-y-2 px-2 pb-2">
        <div class="flex justify-between items-center mb-1">
          <h2 class="text-sm font-semibold text-gray-600">Eigenschaften</h2>
          <button
            title="Property hinzufügen"
            class="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50"
            onClick={() => setShowAddProp((v) => !v)}
          >
            <Plus size={16} />
          </button>
        </div>
        <Show when={showAddProp()}>
          <div class="flex flex-wrap items-center gap-2 mb-2 text-sm">
            <input
              type="text"
              placeholder="Key"
              class="border px-2 py-1 rounded w-32"
              value={newKey()}
              onInput={(e) => setNewKey(e.currentTarget.value)}
            />

            <div class="flex gap-1">
              <div class="relative">
                <button
                  class="w-9 h-9 border border-gray-300 rounded flex items-center justify-center hover:bg-gray-100"
                  onClick={() => setShowTypeDropdown((v) => !v)}
                  title="Typ wählen"
                >
                  {neo4jTypes.find((t) => t.value === newType())?.icon}
                </button>

                <Show when={showTypeDropdown()}>
                  <ul class="absolute z-10 mt-1 w-9 bg-white border rounded shadow text-sm">
                    <For each={neo4jTypes}>
                      {(t) => (
                        <li
                          class="p-2 hover:bg-gray-100 cursor-pointer flex justify-center"
                          onClick={() => {
                            setNewType(t.value as any);
                            setShowTypeDropdown(false);
                          }}
                          title={t.title}
                        >
                          {t.icon}
                        </li>
                      )}
                    </For>
                  </ul>
                </Show>
              </div>
            </div>

            <Show when={newType() === "string"}>
              <input
                type="text"
                class="border px-2 py-1 rounded w-40"
                placeholder="Text"
                value={newValue()}
                onInput={(e) => setNewValue(e.currentTarget.value)}
              />
            </Show>

            <Show when={newType() === "integer"}>
              <input
                type="number"
                step="1"
                class="border px-2 py-1 rounded w-40"
                placeholder="Ganzzahl"
                value={newValue()}
                onInput={(e) => setNewValue(e.currentTarget.value)}
              />
            </Show>

            <Show when={newType() === "float"}>
              <input
                type="number"
                step="any"
                class="border px-2 py-1 rounded w-40"
                placeholder="Kommazahl"
                value={newValue()}
                onInput={(e) => setNewValue(e.currentTarget.value)}
              />
            </Show>

            <Show when={newType() === "date"}>
              <input
                type="date"
                class="border px-2 py-1 rounded w-40"
                value={newValue()}
                onInput={(e) => setNewValue(e.currentTarget.value)}
              />
            </Show>

            <Show when={newType() === "time" || newType() === "localTime"}>
              <input
                type="time"
                step="1"
                class="border px-2 py-1 rounded w-40"
                value={newValue()}
                onInput={(e) => setNewValue(e.currentTarget.value)}
              />
            </Show>

            <Show
              when={newType() === "dateTime" || newType() === "localDateTime"}
            >
              <input
                type="datetime-local"
                class="border px-2 py-1 rounded w-40"
                value={newValue()}
                onInput={(e) => setNewValue(e.currentTarget.value)}
              />
            </Show>

            <Show when={newType() === "duration"}>
              <input
                type="text"
                class="border px-2 py-1 rounded w-40"
                placeholder="z. B. P1Y2M3DT4H"
                value={newValue()}
                onInput={(e) => setNewValue(e.currentTarget.value)}
              />
            </Show>

            <Show when={newType() === "boolean"}>
              <label class="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={newValue() === "true"}
                  onChange={(e) =>
                    setNewValue(e.currentTarget.checked ? "true" : "false")
                  }
                />
                <span>Wahr</span>
              </label>
            </Show>

            <button
              class="px-2 py-1 rounded text-white bg-green-600 hover:bg-green-700"
              onClick={() => {
                const key = newKey().trim();
                if (!key) return;

                if (localData().hasOwnProperty(key)) {
                  alert("Key existiert bereits.");
                  return;
                }

                setLocalData((prev) => ({ ...prev, [key]: newValue() }));
                setNewKey("");
                setNewValue("");
                setNewType("string");
                setShowAddProp(false);
              }}
            >
              Hinzufügen
            </button>
          </div>
        </Show>

        <ul class="space-y-1">
          <Show when={props.elementId}>
            <li class="flex justify-between gap-2 border-b border-gray-200 pb-1 group">
              <span class="font-mono text-gray-500">&lt;elementId&gt;</span>
              <div class="flex items-center gap-1">
                <span class="truncate text-right font-mono text-gray-700">
                  {props.elementId}
                </span>
                <button
                  class="opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() =>
                    navigator.clipboard.writeText(props.elementId!)
                  }
                  title="Kopieren"
                >
                  <ClipboardCopy
                    size={14}
                    class="text-gray-400 hover:text-black"
                  />
                </button>
              </div>
            </li>
          </Show>

          <Show when={props.identity}>
            <li class="flex justify-between gap-2 border-b border-gray-200 pb-1 group">
              <span class="font-mono text-gray-500">&lt;id&gt;</span>
              <div class="flex items-center gap-1">
                <span class="truncate text-right font-mono text-gray-700">
                  {props.identity?.low}
                </span>
                <button
                  class="opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() =>
                    navigator.clipboard.writeText(
                      props.identity!.low?.toString()
                    )
                  }
                  title="Kopieren"
                >
                  <ClipboardCopy
                    size={14}
                    class="text-gray-400 hover:text-black"
                  />
                </button>
              </div>
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
      </div>
      <div class="fixed bottom-0 left-0 right-0 p-2 border-t bg-white flex justify-between items-center">
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
