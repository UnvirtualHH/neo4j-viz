import { ClipboardCopy, Trash } from "lucide-solid";
import {
  Component,
  createEffect,
  createSignal,
  onCleanup,
  Show,
} from "solid-js";
import { inferNeo4jType, Neo4jValueType } from "../../types/neo4jvalues";
import { neo4jTypeIcons } from "../layout/Neo4jTypeIcons";
import { useAppContext } from "../../AppContext";

type EditablePropProps = {
  keyName: string;
  value: any;
  onChange: (val: any) => void;
  onCopy: () => void;
  onDelete?: () => void;
  readonly?: boolean;
};

function isDateString(value: any): boolean {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

const EditableProp: Component<EditablePropProps> = (props) => {
  const { t } = useAppContext();

  const [editing, setEditing] = createSignal(false);
  const [temp, setTemp] = createSignal(String(props.value));
  const inputRef = { current: null as HTMLInputElement | null };
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

  createEffect(() => {
    if (editing() && inputRef.current) {
      inputRef.current.focus();
    }
  });

  createEffect(() => {
    if (editing()) {
      const handleClickOutside = (e: MouseEvent) => {
        if (inputRef.current && !inputRef.current.contains(e.target as Node)) {
          handleBlur();
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      onCleanup(() =>
        document.removeEventListener("mousedown", handleClickOutside)
      );
    }
  });

  const type = (): Neo4jValueType => {
    if (props.keyName === "id" || props.keyName === "identity") return "id";
    if (props.keyName === "elementId") return "elementId";
    return inferNeo4jType(props.value);
  };

  return (
    <li class="flex justify-between gap-2 border-b border-gray-200 pb-1 group items-center">
      <div class="flex items-center gap-1 group">
        <span title={type()}>
          {neo4jTypeIcons[type()]?.() ?? neo4jTypeIcons["any"]()}
        </span>
        <span class="font-mono">{props.keyName}</span>

        <Show when={props.onDelete}>
          <button
            onClick={props.onDelete}
            class="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity"
            title={t("properties_dialog.delete_property")}
          >
            <Trash size={14} stroke-width={2} />
          </button>
        </Show>
      </div>

      <div class="flex items-center gap-1">
        <Show
          when={editing() && !props.readonly}
          fallback={
            <span
              class="truncate text-right cursor-pointer"
              onClick={() => !props.readonly && setEditing(true)}
              title={
                props.readonly
                  ? t("properties_dialog.read_only")
                  : t("properties_dialog.click_to_edit")
              }
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
              ref={(el) => (inputRef.current = el)}
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
              ref={(el) => (inputRef.current = el)}
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
              ref={(el) => (inputRef.current = el)}
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
              ref={(el) => (inputRef.current = el)}
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
          onClick={props.onCopy}
          class="text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity"
          title={t("properties_dialog.copy_property")}
        >
          <ClipboardCopy size={14} stroke-width={2} />
        </button>
      </div>
    </li>
  );
};

export default EditableProp;
