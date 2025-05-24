import { createSignal } from "solid-js";
import { autocomplete, DbSchema } from "@neo4j-cypher/language-support";

type Suggestion = {
  label: string;
  kind: string;
};

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
  const [suggestions, setSuggestions] = createSignal<Suggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = createSignal(0);

  const updateSuggestions = (code: string, cursor: number) => {
    if (!code || cursor < 0) {
      setSuggestions([]);
      return;
    }

    try {
      const rawItems = autocomplete(code, schema, cursor);
      const mappedItems = rawItems.map((item) => ({
        label: item.label,
        kind: CompletionKindMap[item.kind ?? -1] || "unknown",
      }));
      setSuggestions(mappedItems);
      setSelectedIndex(0);
    } catch (err) {
      console.warn("Autocomplete failed:", err);
      setSuggestions([]);
    }
  };

  const clearSuggestions = () => {
    setSuggestions([]);
  };

  return {
    suggestions,
    selectedIndex,
    setSelectedIndex,
    updateSuggestions,
    clearSuggestions,
  };
}
