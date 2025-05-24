import { Star, Trash2 } from "lucide-solid";
import { onCleanup, onMount } from "solid-js";
import {
  FavoriteEntry,
  favorites,
  removeQueryFromFavorites,
} from "../../../store/favorites";

const Favorites = (props: {
  onSelect: (query: string) => void;
  onClose: () => void;
}) => {
  let popupRef: HTMLDivElement | undefined;

  const handleClickOutside = (e: MouseEvent) => {
    if (popupRef && !popupRef.contains(e.target as Node)) {
      props.onClose();
    }
  };

  onMount(() => document.addEventListener("mousedown", handleClickOutside));
  onCleanup(() =>
    document.removeEventListener("mousedown", handleClickOutside)
  );

  return (
    <div
      ref={(el) => (popupRef = el)}
      class="absolute bottom-20 left-1/2 -translate-x-1/2 z-50 w-96 bg-white/90 backdrop-blur-md border border-gray-300 rounded-xl shadow-xl p-4 animate-slide-up text-sm max-h-[60vh] overflow-y-auto"
    >
      <h3 class="font-semibold text-gray-700 mb-3 flex items-center gap-2">
        <Star class="w-4 h-4" />
        Favoriten
      </h3>

      <div class="space-y-2">
        {favorites().length === 0 && (
          <p class="text-gray-500 italic">Keine Favoriten gespeichert.</p>
        )}

        {favorites().map((query: FavoriteEntry) => (
          <div class="flex items-start justify-between gap-2 p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition">
            <button
              onClick={() => props.onSelect(query.query)}
              class="text-left text-gray-800 text-sm whitespace-pre-wrap break-words flex-1"
            >
              {query.query}
            </button>
            <button
              onClick={() => removeQueryFromFavorites(query.query)}
              class="text-red-500 hover:text-red-700"
              title="Entfernen"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Favorites;
