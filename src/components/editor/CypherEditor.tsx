import { onMount, onCleanup } from "solid-js";
import { useCypherAutocomplete } from "./autocomplete";
import { highlightCypher } from "./highlight";
import "./CypherEditor.css";

export default function CypherEditor() {
  let inputRef!: HTMLTextAreaElement;
  let highlightRef!: HTMLDivElement;
  let lineNumberRef!: HTMLDivElement;
  let autocompleteRef!: HTMLDivElement;

  const schema = {
    labels: ["Person", "Movie"],
    relationshipTypes: ["ACTED_IN", "DIRECTED"],
  };

  const {
    suggestions,
    selectedIndex,
    setSelectedIndex,
    updateSuggestions,
    clearSuggestions,
  } = useCypherAutocomplete(schema);

  const syncHighlight = () => {
    const code = inputRef.value;
    const cursor = inputRef.selectionStart;
    highlightRef.innerHTML = highlightCypher(code);
    updateLineNumbers(code);

    if (code.length > 3) updateSuggestions(code, cursor);
    else clearSuggestions();
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

    clearSuggestions();
    syncHighlight();
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    const list = suggestions();
    if (!list.length) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => (i + 1) % list.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => (i - 1 + list.length) % list.length);
    } else if (e.key === "Enter") {
      const selected = list[selectedIndex()];
      if (selected) {
        e.preventDefault();
        insertAutocomplete(selected.label);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      clearSuggestions();
    }
  };

  const handleClickOutside = (e: MouseEvent) => {
    if (!autocompleteRef?.contains(e.target as Node)) clearSuggestions();
  };

  onMount(() => {
    syncHighlight();
    document.addEventListener("mousedown", handleClickOutside);
  });

  onCleanup(() => {
    document.removeEventListener("mousedown", handleClickOutside);
  });

  return (
    <div class="editor-container">
      {suggestions().length > 0 && (
        <div class="autocomplete-box" ref={autocompleteRef}>
          {suggestions().map((item, index) => (
            <div
              class={`autocomplete-item ${
                index === selectedIndex() ? "selected" : ""
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
      <div class="highlight-layer" ref={highlightRef} aria-hidden="true"></div>
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
  );
}
