import {
  onMount,
  onCleanup,
  createSignal,
  createEffect,
  Component,
} from "solid-js";
import { useCypherAutocomplete } from "./autocomplete";
import { highlightCypher } from "./highlight";
import "./CypherEditor.css";
import { getFullSchema, runCypherQuery } from "../../service/cypher";
import { DbSchema } from "@neo4j-cypher/language-support";
import { isConnected } from "../../state/connection";
import { Circle, Timer, Workflow } from "lucide-solid";
import FloatingDialog from "../dialog/FloatingDialog";
import { autoDockPosition } from "../dialog/autoDockPosition";

type CypherEditorProps = {
  onQueryResult: (data: any[]) => void;
};

const CypherEditor: Component<CypherEditorProps> = (props) => {
  let inputRef!: HTMLTextAreaElement;
  let highlightRef!: HTMLDivElement;
  let lineNumberRef!: HTMLDivElement;
  let autocompleteRef!: HTMLDivElement;

  const [error, setError] = createSignal<string | null>(null);
  const [loading, setLoading] = createSignal(false);
  const [schema, setSchema] = createSignal<DbSchema | null>(null);
  const [queryTime, setQueryTime] = createSignal<number | null>(null);
  const [nodeCount, setNodeCount] = createSignal<number | null>(null);
  const [relCount, setRelCount] = createSignal<number | null>(null);
  const [labelStats, setLabelStats] = createSignal<Record<string, number>>({});
  const [relTypeStats, setRelTypeStats] = createSignal<Record<string, number>>(
    {}
  );

  const [autocomplete, setAutocomplete] = createSignal<ReturnType<
    typeof useCypherAutocomplete
  > | null>(null);

  const [minimized, setMinimized] = createSignal(false);
  const [position, setPosition] = createSignal({ x: 0, y: 20 });
  let dragOffset = { x: 0, y: 0 };
  let dragging = false;

  createEffect(() => {
    if (schema()) {
      setAutocomplete(useCypherAutocomplete(schema()!));
    }
  });

  const syncHighlight = () => {
    const code = inputRef.value;
    const cursor = inputRef.selectionStart;
    highlightRef.innerHTML = highlightCypher(code);
    updateLineNumbers(code);

    if (code.length > 3) {
      autocomplete()?.updateSuggestions(code, cursor);
    } else {
      autocomplete()?.clearSuggestions();
    }
  };

  const updateLineNumbers = (code: string) => {
    const lines = code.split("\n").length || 1;
    lineNumberRef.innerHTML = Array.from(
      { length: lines },
      (_, i) => i + 1
    ).join("<br>");
  };

  const syncScroll = () => {
    highlightRef.scrollTop = inputRef.scrollTop;
    highlightRef.scrollLeft = inputRef.scrollLeft;
    lineNumberRef.scrollTop = inputRef.scrollTop;
  };

  const getCurrentWordInfo = () => {
    const cursor = inputRef.selectionStart;
    const before = inputRef.value.slice(0, cursor);
    const match = before.match(/[\w]+$/);
    if (!match) return { start: cursor, word: "" };
    return { start: cursor - match[0].length, word: match[0] };
  };

  const insertAutocomplete = (text: string) => {
    const cursor = inputRef.selectionStart;
    const { start } = getCurrentWordInfo();
    const before = inputRef.value.slice(0, start);
    const after = inputRef.value.slice(cursor);

    inputRef.value = before + text + after;
    inputRef.selectionStart = inputRef.selectionEnd = start + text.length;

    autocomplete()?.clearSuggestions();
    syncHighlight();
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      executeQuery();
      return;
    }

    const auto = autocomplete();
    if (!auto) return;

    const list = auto.suggestions();
    if (!list.length) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      auto.setSelectedIndex((i) => (i + 1) % list.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      auto.setSelectedIndex((i) => (i - 1 + list.length) % list.length);
    } else if (e.key === "Enter") {
      const selected = list[auto.selectedIndex()];
      if (selected) {
        e.preventDefault();
        insertAutocomplete(selected.label);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      auto.clearSuggestions();
    }
  };

  const handleClickOutside = (e: MouseEvent) => {
    if (!autocompleteRef?.contains(e.target as Node)) {
      autocomplete()?.clearSuggestions();
    }
  };

  const executeQuery = async () => {
    setLoading(true);
    setError(null);

    try {
      const {
        data,
        executionTimeMs,
        nodeCount,
        relationshipCount,
        labelStats,
        relTypeStats,
      } = await runCypherQuery(inputRef.value);
      setQueryTime(executionTimeMs);
      setNodeCount(nodeCount);
      setRelCount(relationshipCount);
      setLabelStats(labelStats);
      setRelTypeStats(relTypeStats);
      props.onQueryResult(data);
    } catch (err: any) {
      setError(err.message || "Unbekannter Fehler");
    } finally {
      setLoading(false);
    }
  };

  createEffect(async () => {
    if (isConnected()) {
      try {
        const fullSchema = await getFullSchema();
        setSchema(fullSchema);
      } catch (err) {
        console.error("Fehler beim Laden des Schemas:", err);
        setError("Verbindung konnte nicht hergestellt werden.");
      }
    }
  });

  onMount(async () => {
    syncHighlight();

    const defaultWidth = 600;
    const padding = 20;

    setPosition({
      x: window.innerWidth - defaultWidth - padding,
      y: 20,
    });
    document.addEventListener("mousedown", handleClickOutside);
  });

  onCleanup(() => {
    document.removeEventListener("mousedown", handleClickOutside);
  });

  return (
    <FloatingDialog
      title="Cypher Editor"
      initialPosition={autoDockPosition("top-right", { width: 600 })}
      initialSize={{ width: 600, height: 380 }}
      closable={false}
      minimizable={true}
      draggable={true}
      resizable={true}
      onClose={() => setMinimized(true)}
    >
      <div class="editor-container">
        {autocomplete()?.suggestions()!.length! > 0 && (
          <div class="autocomplete-box" ref={autocompleteRef}>
            {autocomplete()
              ?.suggestions()
              .map((item, index) => (
                <div
                  class={`autocomplete-item ${
                    index === autocomplete()?.selectedIndex() ? "selected" : ""
                  }`}
                  onMouseDown={() => insertAutocomplete(item.label)}
                >
                  <span class="suggestion-label">{item.label}</span>
                  <span class="suggestion-type">{item.kind}</span>
                </div>
              ))}
          </div>
        )}

        <div class="line-numbers" ref={lineNumberRef}></div>
        <div class="highlight-layer" ref={highlightRef} aria-hidden="true" />
        <textarea
          class="editor-input"
          ref={inputRef}
          onInput={syncHighlight}
          onKeyDown={handleKeyDown}
          onScroll={syncScroll}
          spellcheck={false}
        />

        <button
          class="btn execute-btn floating-btn"
          onClick={executeQuery}
          disabled={loading()}
        >
          {loading() ? "Running..." : "Execute Query"}
        </button>
      </div>

      <div class="editor-info flex flex-col gap-1 mt-2">
        {error() && <div class="error-message">{error()}</div>}

        {queryTime() !== null && (
          <div class="text-sm text-gray-500 flex items-center gap-3">
            <div class="flex items-center gap-1">
              <Timer size={16} strokeWidth={1.5} />
              <span>{queryTime()!.toFixed(1)} ms</span>
            </div>
            {nodeCount() !== null && (
              <div class="flex items-center gap-1">
                <Circle size={16} strokeWidth={1.5} />
                <span>{nodeCount()} Nodes</span>
              </div>
            )}
            {relCount() !== null && (
              <div class="flex items-center gap-1">
                <Workflow size={16} strokeWidth={1.5} />
                <span>{relCount()} Relations</span>
              </div>
            )}
          </div>
        )}

        {Object.keys(labelStats()).length > 0 && (
          <div class="text-sm text-gray-600 flex flex-wrap gap-4">
            {Object.entries(labelStats()).map(([label, count]) => (
              <div class="flex items-center gap-1" title="Knoten mit Label">
                <Circle size={14} strokeWidth={1.5} />
                <span>
                  {label}: {count}
                </span>
              </div>
            ))}
          </div>
        )}

        {Object.keys(relTypeStats()).length > 0 && (
          <div class="text-sm text-gray-600 flex flex-wrap gap-4">
            {Object.entries(relTypeStats()).map(([type, count]) => (
              <div class="flex items-center gap-1" title="Beziehungen">
                <Workflow size={14} strokeWidth={1.5} />
                <span>
                  {type}: {count}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </FloatingDialog>
  );
};

export default CypherEditor;
