import {
  onMount,
  onCleanup,
  createSignal,
  createEffect,
  Component,
} from "solid-js";
import { useCypherAutocomplete } from "../../utils/editor/autocomplete";
import { highlightCypher } from "../../utils/editor/highlight";
import "./CypherEditor.css";
import { getFullSchema, runCypherQuery } from "../../service/cypher";
import { isConnected } from "../../store/connection";
import { Circle, Timer, Workflow } from "lucide-solid";
import FloatingDialog from "../dialog/FloatingDialog";
import { autoDockPosition } from "../dialog/autoDockPosition";
import { DbSchema } from "../../types/schema";
import { editorQuery } from "../../store/query";
import { CypherQueryResult } from "../../types/graphdata";

import ErrorBanner from "./ErrorBanner";
import AutocompleteBox from "./AutocompleteBox";
import { useSetting } from "../../store/settings";

const CypherEditor: Component<{
  onQueryResult: (result: CypherQueryResult) => void;
}> = (props) => {
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
  const [autocomplete, setAutocomplete] = createSignal<ReturnType<
    typeof useCypherAutocomplete
  > | null>(null);

  const autocompleteSetting = useSetting("enableAutocomplete");

  let suppressAutocomplete = false;

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

    if (!autocompleteSetting.get() || suppressAutocomplete) {
      suppressAutocomplete = false;
      autocomplete()?.clearSuggestions();
      return;
    }

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
    suppressAutocomplete = true;
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
    setLoading(true);
    setError(null);

    try {
      const result = await runCypherQuery(inputRef.value);
      setQueryTime(result.executionTimeMs);
      setNodeCount(result.nodeCount);
      setRelCount(result.relationshipCount);
      props.onQueryResult(result);
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
    document.addEventListener("mousedown", handleClickOutside);
  });

  createEffect(() => {
    const newQuery = editorQuery();

    if (newQuery && inputRef && inputRef.value !== newQuery) {
      suppressAutocomplete = true;
      inputRef.value = newQuery;
      inputRef.selectionStart = inputRef.selectionEnd = newQuery.length;
      executeQuery();
      syncHighlight();
    }
  });

  onCleanup(() => {
    document.removeEventListener("mousedown", handleClickOutside);
  });

  const suggestions = () => autocomplete()?.suggestions() || [];

  return (
    <FloatingDialog
      title="Cypher Editor"
      initialPosition={autoDockPosition("top-right", { width: 600 })}
      initialSize={{ width: 600, height: 240 }}
      closable={false}
      minimizable
      draggable
      resizable
      trayable
      onClose={() => {}}
    >
      <div class="editor-container relative">
        <div class="quick-query-buttons absolute top-2 right-2 flex gap-2 z-10">
          <button
            class="icon-btn"
            title="Alle Knoten anzeigen"
            onClick={() => insertQuickQuery("MATCH (n) RETURN n;")}
          >
            {" "}
            <Circle size={14} />{" "}
          </button>
          <button
            class="icon-btn"
            title="Alle Verbindungen anzeigen"
            onClick={() =>
              insertQuickQuery("MATCH (n)-[r]-(m) RETURN n, r, m;")
            }
          >
            {" "}
            <Workflow size={14} />{" "}
          </button>
        </div>

        {suggestions().length > 0 && autocomplete() && (
          <div ref={autocompleteRef}>
            <AutocompleteBox
              suggestions={suggestions()}
              selectedIndex={autocomplete()!.selectedIndex()}
              onSelect={insertAutocomplete}
            />
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

        {error() && <ErrorBanner message={error()!} />}
      </div>
    </FloatingDialog>
  );
};

export default CypherEditor;
