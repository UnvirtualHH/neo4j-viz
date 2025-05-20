import { createSignal } from "solid-js";
import { autocomplete, DbSchema } from "@neo4j-cypher/language-support";

const CompletionKindMap: Record<number, string> = {
  3: "function",
  6: "variable",
  7: "label",
  10: "property",
  14: "keyword",
  15: "relationship",
  25: "type",
};

export function useCypherAutocomplete(schema: DbSchema) {
  const [suggestions, setSuggestions] = createSignal<{ label: string; kind: string }[]>([]);
  const [selectedIndex, setSelectedIndex] = createSignal(0);

  const updateSuggestions = (code: string, cursor: number) => {
    const items = autocomplete(code, schema, cursor).map((item) => ({
      label: item.label,
      kind: CompletionKindMap[item.kind ?? -1] || "unknown",
    }));
    setSuggestions(items);
    setSelectedIndex(0);
  };

  return {
    suggestions,
    selectedIndex,
    setSelectedIndex,
    updateSuggestions,
    clearSuggestions: () => setSuggestions([]),
  };
}
