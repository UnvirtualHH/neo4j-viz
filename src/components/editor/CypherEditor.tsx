import { onMount, onCleanup, createSignal, createEffect } from "solid-js";
import { useCypherAutocomplete } from "./autocomplete";
import { highlightCypher } from "./highlight";
import "./CypherEditor.css";
import { getFullSchema, runCypherQuery } from "../../service/cypher";
import { DbSchema } from "@neo4j-cypher/language-support";

export default function CypherEditor() {
  let inputRef!: HTMLTextAreaElement;
  let highlightRef!: HTMLDivElement;
  let lineNumberRef!: HTMLDivElement;
  let autocompleteRef!: HTMLDivElement;

  const [result, setResult] = createSignal<any[]>([]);
  const [error, setError] = createSignal<string | null>(null);
  const [loading, setLoading] = createSignal(false);
  const [schema, setSchema] = createSignal<DbSchema | null>(null);

  const [autocomplete, setAutocomplete] = createSignal<ReturnType<
    typeof useCypherAutocomplete
  > | null>(null);

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
    setResult([]);

    try {
      const res = await runCypherQuery(inputRef.value);
      setResult(res);
    } catch (err: any) {
      setError(err.message || "Unbekannter Fehler");
    } finally {
      setLoading(false);
    }
  };

  onMount(async () => {
    const fullSchema = await getFullSchema();
    setSchema(fullSchema);

    syncHighlight();
    document.addEventListener("mousedown", handleClickOutside);
  });

  onCleanup(() => {
    document.removeEventListener("mousedown", handleClickOutside);
  });

  return (
    <div>
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
        <div
          class="highlight-layer"
          ref={highlightRef}
          aria-hidden="true"
        ></div>
        <textarea
          class="editor-input"
          ref={inputRef}
          onInput={syncHighlight}
          onKeyDown={handleKeyDown}
          onScroll={syncScroll}
          spellcheck={false}
          autofocus
        ></textarea>
      </div>
      <div>
        <button class="btn" onClick={executeQuery} disabled={loading()}>
          {loading() ? "Running..." : "Execute Query"}
        </button>

        {error() && <div class="error">{error()}</div>}

        {result().length > 0 && (
          <pre class="query-result">{JSON.stringify(result(), null, 2)}</pre>
        )}
      </div>
    </div>
  );
}
