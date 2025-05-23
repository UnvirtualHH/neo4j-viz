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
import { isConnected } from "../../store/connection";
import { Circle, Timer, Workflow } from "lucide-solid";
import FloatingDialog from "../dialog/FloatingDialog";
import { autoDockPosition } from "../dialog/autoDockPosition";
import { DbSchema } from "../../types/schema";
import { addQueryToHistory } from "../../store/history";
import { editorQuery } from "../../store/query";

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

  const insertQuickQuery = (query: string) => {
    inputRef.value = query;
    syncHighlight();
    executeQuery();
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
    addQueryToHistory(inputRef.value);

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

  onMount(() => {
    syncHighlight();
    const defaultWidth = 600;
    const padding = 20;
    setPosition({
      x: window.innerWidth - defaultWidth - padding,
      y: 20,
    });
    document.addEventListener("mousedown", handleClickOutside);
  });

  createEffect(() => {
    const newQuery = editorQuery();
    if (newQuery && inputRef && inputRef.value !== newQuery) {
      inputRef.value = newQuery;
      inputRef.selectionStart = inputRef.selectionEnd = newQuery.length;
      executeQuery();
      syncHighlight();
    }
  });

  onCleanup(() => {
    document.removeEventListener("mousedown", handleClickOutside);
  });

  return (
    <FloatingDialog
      title="Cypher Editor"
      initialPosition={autoDockPosition("top-right", { width: 600 })}
      initialSize={{ width: 600, height: 240 }}
      closable={false}
      minimizable={true}
      draggable={true}
      resizable={true}
      trayable={true}
      onClose={() => setMinimized(true)}
    >
      <div class="editor-container relative">
        <div class="quick-query-buttons absolute top-2 right-2 flex gap-2 z-10">
          <button
            class="icon-btn"
            title="Alle Knoten anzeigen"
            onClick={() => insertQuickQuery("MATCH (n) RETURN n;")}
          >
            <Circle size={14} />
          </button>
          <button
            class="icon-btn"
            title="Alle Verbindungen anzeigen"
            onClick={() =>
              insertQuickQuery("MATCH (n)-[r]-(m) RETURN n, r, m;")
            }
          >
            <Workflow size={14} />
          </button>
        </div>

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

        <div class="editor-status">
          {queryTime() !== null && (
            <div title="Ausführungszeit">
              <div class="flex items-center gap-1">
                <Timer size={12} strokeWidth={1.0} />
                <span>{queryTime()!.toFixed(1)} ms</span>
              </div>
            </div>
          )}
          {nodeCount() !== null && (
            <div title="Knoten">
              <div class="flex items-center gap-1">
                <Circle size={12} strokeWidth={1.0} />
                <span>{nodeCount()} Nodes</span>
              </div>
            </div>
          )}
          {relCount() !== null && (
            <div title="Beziehungen">
              <div class="flex items-center gap-1">
                <Workflow size={12} strokeWidth={1.0} />
                <span>{relCount()} Relations</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </FloatingDialog>
  );
};

export default CypherEditor;
