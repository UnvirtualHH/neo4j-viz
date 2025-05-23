import { For, onCleanup, onMount } from "solid-js";
import { queryHistory } from "../../../store/history";
import { Clock } from "lucide-solid";
import { formatTimeAgo } from "../../../utils/time";

const History = (props: {
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
        <Clock class="w-4 h-4" />
        Query-Verlauf
      </h3>

      <div class="space-y-2">
        <For each={queryHistory()}>
          {(entry) => (
            <button
              onClick={() => props.onSelect(entry.query)}
              title={entry.query}
              class="w-full text-left border border-gray-200 rounded-lg p-2 bg-white hover:bg-gray-50 transition flex flex-col items-start"
            >
              <pre class="font-mono text-gray-800 whitespace-pre-wrap text-xs leading-snug max-h-16 overflow-hidden">
                {entry.query}
              </pre>
              <span
                class="text-xs text-gray-400 mt-1"
                title={new Date(entry.timestamp).toLocaleString()}
              >
                {formatTimeAgo(entry.timestamp)}
              </span>
            </button>
          )}
        </For>
      </div>
    </div>
  );
};

export default History;
