import { createSignal } from "solid-js";

type SearchProps = {
  onSearch: (query: string) => void;
  matchCount: number;
};

export default function Search(props: SearchProps) {
  const [query, setQuery] = createSignal("");

  return (
    <div class="fixed top-4 left-1/2 -translate-x-1/2 z-50">
      <div class="relative w-[300px]">
        <input
          type="text"
          value={query()}
          onInput={(e) => {
            const value = e.currentTarget.value;
            setQuery(value);
            props.onSearch(value);
          }}
          placeholder="Graph durchsuchen..."
          class="w-full p-2 pr-16 rounded border border-gray-400 shadow bg-white text-sm focus:outline-none"
        />
        <div class="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 pointer-events-none">
          {props.matchCount} Treffer
        </div>
      </div>
    </div>
  );
}
