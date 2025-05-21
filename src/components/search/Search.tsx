import { createSignal } from "solid-js";

type SearchProps = {
  onSearch: (query: string) => void;
};

export default function Search(props: SearchProps) {
  const [query, setQuery] = createSignal("");

  return (
    <input
      type="text"
      value={query()}
      onInput={(e) => {
        const value = e.currentTarget.value;
        setQuery(value);
        props.onSearch(value);
      }}
      placeholder="Graph durchsuchen..."
      class="fixed top-4 left-1/2 -translate-x-1/2 z-50 p-2 rounded border border-gray-400 shadow bg-white text-sm w-[300px] focus:outline-none"
    />
  );
}
