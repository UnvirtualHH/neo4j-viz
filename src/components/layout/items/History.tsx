// src/components/schema/QueryHistory.tsx
import { For, onCleanup, onMount } from "solid-js";
import { queryHistory } from "../../../store/history";
import { Clock } from "lucide-solid";

const History = (props: {
  onSelect: (query: string) => void;
  onClose: () => void;
}) => {
  let popupRef: HTMLDivElement | undefined;

  onMount(() => document.addEventListener("mousedown", handleClickOutside));
  onCleanup(() =>
    document.removeEventListener("mousedown", handleClickOutside)
  );

  const handleClickOutside = (e: MouseEvent) => {
    if (popupRef && !popupRef.contains(e.target as Node)) {
      props.onClose();
    }
  };

  return (
    <div
      ref={(el) => (popupRef = el)}
      class="absolute bottom-20 left-1/2 -translate-x-1/2 z-50 w-96 bg-white/90 backdrop-blur-md border border-gray-300 rounded-xl shadow-xl p-4 animate-slide-up text-sm max-h-[60vh] overflow-y-auto"
    >
      <h3 class="font-semibold text-gray-700 mb-2 flex items-center gap-2">
        <Clock class="w-4 h-4" />
        Query-Verlauf
      </h3>
      <For each={queryHistory()}>
        {(q) => (
          <button
            onClick={() => props.onSelect(q)}
            class="block w-full text-left truncate text-gray-700 hover:bg-gray-100 px-2 py-1 rounded"
            title={q}
          >
            {q}
          </button>
        )}
      </For>
    </div>
  );
};

export default History;
