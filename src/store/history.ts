import { createSignal } from "solid-js";

const HISTORY_KEY = "cypherQueryHistory";
const MAX_ENTRIES = 20;

export type QueryHistoryEntry = {
  query: string;
  timestamp: number;
};

function loadFromStorage(): QueryHistoryEntry[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
}

const [queryHistory, setQueryHistory] = createSignal<QueryHistoryEntry[]>(
  loadFromStorage()
);

function addQueryToHistory(query: string) {
  const trimmed = query.trim();
  if (!trimmed) return;

  const timestamp = Date.now();

  setQueryHistory((prev) => {
    if (prev[0]?.query === trimmed) return prev;

    const updated = [{ query: trimmed, timestamp }, ...prev].slice(
      0,
      MAX_ENTRIES
    );
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    return updated;
  });
}

function clearQueryHistory() {
  setQueryHistory([]);
  localStorage.removeItem(HISTORY_KEY);
}

export { queryHistory, addQueryToHistory, clearQueryHistory };
