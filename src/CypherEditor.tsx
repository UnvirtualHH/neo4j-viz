import { onMount } from "solid-js";
import "./CypherEditor.css";

export default function CypherEditor() {
  let inputRef!: HTMLTextAreaElement;
  let highlightRef!: HTMLDivElement;
  let lineNumberRef!: HTMLDivElement;

  const highlightCypher = (code: string): string => {
    const escaped = code
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    return escaped
      .replace(
        /\b(MATCH|RETURN|WHERE|CREATE|SET|DELETE|MERGE|WITH)\b/gi,
        '<span class="keyword">$1</span>'
      )
      .replace(/'([^']*)'/g, `<span class="string">'$1'</span>`)
      .replace(/(:[a-zA-Z_][a-zA-Z0-9_]*)/g, '<span class="label">$1</span>')
      .replace(/\n/g, "<br>");
  };

  const syncHighlight = () => {
    const code = inputRef.value;
    highlightRef.innerHTML = highlightCypher(code);
    updateLineNumbers(code);
  };

  const syncScroll = () => {
    highlightRef.scrollTop = inputRef.scrollTop;
    highlightRef.scrollLeft = inputRef.scrollLeft;
    lineNumberRef.scrollTop = inputRef.scrollTop;
  };

  const updateLineNumbers = (code: string) => {
    const lineCount = code.split("\n").length || 1;
    lineNumberRef.innerHTML = Array.from(
      { length: lineCount },
      (_, i) => `${i + 1}`
    ).join("<br>");
  };

  onMount(() => {
    syncHighlight();
  });

  return (
    <div class="editor-container">
      <div class="line-numbers" ref={lineNumberRef}></div>
      <div class="highlight-layer" ref={highlightRef} aria-hidden="true"></div>
      <textarea
        class="editor-input"
        ref={inputRef}
        onInput={syncHighlight}
        onScroll={syncScroll}
        spellcheck={false}
        autofocus
      ></textarea>
    </div>
  );
}
