import { createSignal } from "solid-js";

const HISTORY_KEY = "cypherQueryHistory";
const MAX_ENTRIES = 20;

function loadFromStorage(): string[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
}

const [queryHistory, setQueryHistory] = createSignal<string[]>(
  loadFromStorage()
);

function addQueryToHistory(query: string) {
  const trimmed = query.trim();
  if (!trimmed) return;

  setQueryHistory((prev) => {
    if (prev[0] === trimmed) return prev;
    const updated = [trimmed, ...prev].slice(0, MAX_ENTRIES);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    return updated;
  });
}

function clearQueryHistory() {
  setQueryHistory([]);
  localStorage.removeItem(HISTORY_KEY);
}

export { queryHistory, addQueryToHistory, clearQueryHistory };
