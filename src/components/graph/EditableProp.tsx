import { Component, createEffect, createSignal, Show } from "solid-js";
import { ClipboardCopy } from "lucide-solid";
import { inferNeo4jType, Neo4jValueType } from "../../types/neo4jvalues";
import { neo4jTypeIcons } from "../layout/Neo4jTypeIcons";

type EditablePropProps = {
  keyName: string;
  value: any;
  onChange: (val: any) => void;
  onCopy: () => void;
  readonly?: boolean;
};

function isDateString(value: any): boolean {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

const EditableProp: Component<EditablePropProps> = (props) => {
  const [editing, setEditing] = createSignal(false);
  const [temp, setTemp] = createSignal(String(props.value));

  createEffect(() => {
    if (!editing()) {
      setTemp(String(props.value));
    }
  });

  const handleBlur = () => {
    const val = temp();
    let parsed: any = val;

    if (typeof props.value === "boolean") {
      parsed = val === "true";
    } else if (typeof props.value === "number") {
      parsed = Number(val);
    }

    props.onChange(parsed);
    setEditing(false);
  };

  const type = (): Neo4jValueType => {
    if (props.keyName === "id" || props.keyName === "identity") return "id";
    if (props.keyName === "elementId") return "elementId";
    return inferNeo4jType(props.value);
  };

  return (
    <li class="flex justify-between gap-2 border-b border-gray-200 pb-1 group items-center">
      <div class="flex items-center gap-1 text-gray-500">
        <span title={type()}>
          {neo4jTypeIcons[type()]?.() ?? neo4jTypeIcons["any"]()}
        </span>
        <span class="font-mono">{props.keyName}</span>
      </div>

      <div class="flex items-center gap-1">
        <Show
          when={editing() && !props.readonly}
          fallback={
            <span
              class="truncate text-right cursor-pointer"
              onClick={() => !props.readonly && setEditing(true)}
              title={props.readonly ? "Nur lesen" : "Zum Bearbeiten klicken"}
            >
              {typeof props.value === "string"
                ? `"${props.value}"`
                : String(props.value)}
            </span>
          }
        >
          <Show when={typeof props.value === "boolean"}>
            <input
              type="checkbox"
              checked={props.value}
              onChange={(e) => {
                props.onChange(e.currentTarget.checked);
                setEditing(false);
              }}
              class="w-4 h-4"
            />
          </Show>

          <Show when={typeof props.value === "number"}>
            <input
              type="number"
              class="text-sm border px-1 py-0.5 rounded w-32 font-mono"
              value={temp()}
              onInput={(e) => setTemp(e.currentTarget.value)}
              onBlur={handleBlur}
              onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
              autofocus
            />
          </Show>

          <Show when={isDateString(props.value)}>
            <input
              type="date"
              class="text-sm border px-1 py-0.5 rounded w-40 font-mono"
              value={temp()}
              onInput={(e) => setTemp(e.currentTarget.value)}
              onBlur={handleBlur}
              onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
              autofocus
            />
          </Show>

          <Show
            when={
              typeof props.value !== "boolean" &&
              typeof props.value !== "number" &&
              !isDateString(props.value)
            }
          >
            <input
              class="text-sm border px-1 py-0.5 rounded w-64 font-mono"
              value={temp()}
              onInput={(e) => setTemp(e.currentTarget.value)}
              onBlur={handleBlur}
              onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
              autofocus
            />
          </Show>
        </Show>

        <button
          class="opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={props.onCopy}
          title="Kopieren"
        >
          <ClipboardCopy size={14} class="text-gray-400 hover:text-black" />
        </button>
      </div>
    </li>
  );
};

export default EditableProp;
