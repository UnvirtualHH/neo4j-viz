import { ClipboardCopy } from "lucide-solid";
import { Component, createEffect, createSignal } from "solid-js";

type EditablePropProps = {
  keyName: string;
  value: any;
  onChange: (val: any) => void;
  onCopy: () => void;
};

const EditableProp: Component<EditablePropProps> = (props) => {
  const [editing, setEditing] = createSignal(false);
  const [temp, setTemp] = createSignal(String(props.value));

  createEffect(() => {
    if (!editing()) {
      setTemp(String(props.value));
    }
  });

  return (
    <li class="flex justify-between gap-2 border-b border-gray-200 pb-1 group">
      <span class="font-mono text-gray-500">{props.keyName}</span>
      <div class="flex items-center gap-1">
        {editing() ? (
          <input
            class="text-sm border px-1 py-0.5 rounded w-64 font-mono"
            value={temp()}
            onInput={(e) => setTemp(e.currentTarget.value)}
            onBlur={() => {
              props.onChange(temp());
              setEditing(false);
            }}
            onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
            autofocus
          />
        ) : (
          <span
            class="truncate text-right cursor-pointer"
            onClick={() => setEditing(true)}
            title="Zum Bearbeiten klicken"
          >
            {typeof props.value === "string"
              ? `"${props.value}"`
              : String(props.value)}
          </span>
        )}

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
