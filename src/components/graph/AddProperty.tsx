import { createSignal, Show, For, type Component } from "solid-js";
import { Neo4jValueType } from "../../types/neo4jvalues";
import { neo4jTypeIcons } from "../layout/Neo4jTypeIcons";
import { Plus } from "lucide-solid";

const groupedTypes: {
  label: string;
  types: { value: Neo4jValueType; title: string }[];
}[] = [
  {
    label: "Einfach",
    types: [
      { value: "string", title: "Text" },
      { value: "boolean", title: "Boolean" },
      { value: "integer", title: "Ganzzahl" },
      { value: "float", title: "Kommazahl" },
    ],
  },
  {
    label: "Zeit",
    types: [
      { value: "date", title: "Datum" },
      { value: "time", title: "Zeit" },
      { value: "localTime", title: "Zeit (lokal)" },
      { value: "dateTime", title: "Zeitstempel" },
      { value: "localDateTime", title: "Zeitstempel (lokal)" },
      { value: "duration", title: "Dauer" },
    ],
  },
  {
    label: "Strukturiert",
    types: [
      { value: "point", title: "Koordinate" },
      { value: "map", title: "Map" },
      { value: "list", title: "Liste" },
    ],
  },
];

type Props = {
  existingKeys: string[];
  onAdd: (key: string, value: any) => void;
};

const AddPropertyForm: Component<Props> = (props) => {
  const [key, setKey] = createSignal("");
  const [value, setValue] = createSignal("");
  const [type, setType] = createSignal<Neo4jValueType>("string");
  const [showDropdown, setShowDropdown] = createSignal(false);

  const parsedValue = (): any => {
    const raw = value().trim();
    switch (type()) {
      case "integer":
        return parseInt(raw);
      case "float":
        return parseFloat(raw);
      case "boolean":
        return raw === "true";
      case "date":
      case "time":
      case "dateTime":
      case "localTime":
      case "localDateTime":
      case "duration":
      case "point":
      case "map":
      case "list":
        return raw;
      default:
        return raw;
    }
  };

  const handleAdd = () => {
    const k = key().trim();
    if (!k) return;
    if (props.existingKeys.includes(k)) {
      alert("Key existiert bereits.");
      return;
    }
    props.onAdd(k, parsedValue());
    setKey("");
    setValue("");
    setType("string");
  };

  return (
    <div class="flex flex-wrap items-center gap-2 text-sm">
      <input
        class="border px-2 py-1 rounded w-32"
        placeholder="Key"
        value={key()}
        onInput={(e) => setKey(e.currentTarget.value)}
      />

      <div class="relative">
        <button
          class="w-9 h-9 border border-gray-300 rounded flex items-center justify-center hover:bg-gray-100"
          title="Typ wählen"
          onClick={() => setShowDropdown((v) => !v)}
        >
          {neo4jTypeIcons[type()]()}
        </button>

        <Show when={showDropdown()}>
          <div class="absolute z-50 mt-1 bg-white border rounded shadow text-sm w-44 max-h-64 overflow-auto">
            <For each={groupedTypes}>
              {(group) => (
                <>
                  <div class="px-2 pt-2 text-xs font-semibold text-gray-500">
                    {group.label}
                  </div>
                  <For each={group.types}>
                    {(t) => (
                      <li
                        class="flex items-center gap-2 px-2 py-1 hover:bg-gray-100 cursor-pointer"
                        title={t.title}
                        onClick={() => {
                          setType(t.value);
                          setShowDropdown(false);
                        }}
                      >
                        {neo4jTypeIcons[t.value]()}
                        <span>{t.title}</span>
                      </li>
                    )}
                  </For>
                </>
              )}
            </For>
          </div>
        </Show>
      </div>

      <Show when={type() !== "boolean"}>
        <input
          type={
            type() === "date"
              ? "date"
              : type() === "time" || type() === "localTime"
              ? "time"
              : type() === "dateTime" || type() === "localDateTime"
              ? "datetime-local"
              : type() === "integer" || type() === "float"
              ? "number"
              : "text"
          }
          class="border px-2 py-1 rounded w-40"
          placeholder="Wert"
          value={value()}
          onInput={(e) => setValue(e.currentTarget.value)}
        />
      </Show>

      <Show when={type() === "boolean"}>
        <label class="flex items-center gap-1">
          <input
            type="checkbox"
            checked={value() === "true"}
            onChange={(e) =>
              setValue(e.currentTarget.checked ? "true" : "false")
            }
          />
          Wahr
        </label>
      </Show>

      <button
        class="w-8 h-8 flex items-center justify-center rounded bg-green-600 text-white hover:bg-green-700"
        onClick={handleAdd}
        title="Property hinzufügen"
      >
        <Plus size={16} />
      </button>
    </div>
  );
};

export default AddPropertyForm;
