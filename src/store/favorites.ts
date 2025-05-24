import { createSignal } from "solid-js";

const FAVORITES_KEY = "cypherQueryFavorites";
const MAX_FAVORITES = 50;

export type FavoriteEntry = {
  query: string;
  addedAt: number;
};

function loadFromStorage(): FavoriteEntry[] {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]");
  } catch {
    return [];
  }
}

const [favorites, setFavorites] = createSignal<FavoriteEntry[]>(loadFromStorage());

function addQueryToFavorites(query: string) {
  const trimmed = query.trim();
  if (!trimmed) return;

  setFavorites((prev) => {
    if (prev.some((e) => e.query === trimmed)) return prev;

    const entry: FavoriteEntry = {
      query: trimmed,
      addedAt: Date.now(),
    };

    const updated = [entry, ...prev].slice(0, MAX_FAVORITES);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
    return updated;
  });
}

function removeQueryFromFavorites(query: string) {
  setFavorites((prev) => {
    const updated = prev.filter((entry) => entry.query !== query);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
    return updated;
  });
}

function clearFavorites() {
  setFavorites([]);
  localStorage.removeItem(FAVORITES_KEY);
}

export {
  favorites,
  addQueryToFavorites,
  removeQueryFromFavorites,
  clearFavorites,
};
