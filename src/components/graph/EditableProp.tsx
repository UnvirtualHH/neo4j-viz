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

function unwrapNeo4jInt(val: any): any {
  if (val && typeof val === "object" && "low" in val && "high" in val) {
    return typeof val.toNumber === "function" ? val.toNumber() : val.low;
  }
  return val;
}

const EditableProp: Component<EditablePropProps> = (props) => {
  const { t } = useAppContext();

  const [editing, setEditing] = createSignal(false);
  const [temp, setTemp] = createSignal<string>("");
  const inputRef = { current: null as HTMLInputElement | null };

  const value = unwrapNeo4jInt(props.value);
  const typeName = isDateString(value) ? "date" : typeof value;

  createEffect(() => {
    if (editing() && typeName !== "boolean") {
      setTemp(value != null ? String(value) : "");
    }
  });

  createEffect(() => {
    if (editing() && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select?.();
    }
  });

  createEffect(() => {
    if (!editing() || typeName === "boolean") return;

    const handleOutside = (e: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(e.target as Node)) {
        handleBlur();
      }
    };

    document.addEventListener("pointerdown", handleOutside);
    onCleanup(() => document.removeEventListener("pointerdown", handleOutside));
  });

  const handleBlur = () => {
    const raw = temp();
    let parsed: any = raw;

    switch (typeName) {
      case "number":
        parsed = isNaN(Number(raw)) ? value : Number(raw);
        break;
      case "date":
        parsed = raw;
        break;
      default:
        parsed = raw;
    }

    if (parsed !== value) {
      props.onChange(parsed);
    }

    setEditing(false);
  };

  const neoType = (): Neo4jValueType => {
    if (props.keyName === "id" || props.keyName === "identity") return "id";
    if (props.keyName === "elementId") return "elementId";
    return inferNeo4jType(props.value);
  };

  return (
    <li class="flex justify-between gap-2 border-b border-gray-200 pb-1 group items-center">
      <div class="flex items-center gap-1 group">
        <span title={neoType()}>
          {neo4jTypeIcons[neoType()]?.() ?? neo4jTypeIcons["any"]()}
        </span>
        <span class="font-mono">{props.keyName}</span>
        <Show when={props.onDelete}>
          <button
            onClick={props.onDelete}
            class="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
            title={t("properties_dialog.delete_property")}
          >
            <Trash size={14} stroke-width={2} />
          </button>
        </Show>
      </div>

      <div class="flex items-center gap-1">
        <Show
          when={!props.readonly && typeName === "boolean"}
          fallback={
            typeName === "boolean" ? (
              <span class="text-right">{String(value)}</span>
            ) : editing() && !props.readonly ? (
              typeName === "number" ? (
                <input
                  type="number"
                  ref={(el) => (inputRef.current = el)}
                  class="text-sm border px-1 py-0.5 rounded w-32 font-mono"
                  value={temp()}
                  onInput={(e) => setTemp(e.currentTarget.value)}
                  onBlur={handleBlur}
                  onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                />
              ) : typeName === "date" ? (
                <input
                  type="date"
                  ref={(el) => (inputRef.current = el)}
                  class="text-sm border px-1 py-0.5 rounded w-40 font-mono"
                  value={temp()}
                  onInput={(e) => setTemp(e.currentTarget.value)}
                  onBlur={handleBlur}
                  onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                />
              ) : (
                <input
                  ref={(el) => (inputRef.current = el)}
                  class="text-sm border px-1 py-0.5 rounded w-64 font-mono"
                  value={temp()}
                  onInput={(e) => setTemp(e.currentTarget.value)}
                  onBlur={handleBlur}
                  onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                />
              )
            ) : (
              <span
                class="truncate text-right cursor-pointer"
                onClick={() => !props.readonly && setEditing(true)}
                title={
                  props.readonly
                    ? t("properties_dialog.read_only")
                    : t("properties_dialog.click_to_edit")
                }
              >
                {typeof value === "string" ? `"${value}"` : String(value)}
              </span>
            )
          }
        >
          <input
            type="checkbox"
            checked={props.value}
            onChange={(e) => props.onChange(e.currentTarget.checked)}
            class="w-4 h-4"
          />
        </Show>

        <button
          onClick={props.onCopy}
          class="text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
          title={t("properties_dialog.copy_property")}
        >
          <ClipboardCopy size={14} stroke-width={2} />
        </button>
      </div>
    </li>
  );
};

export default EditableProp;
