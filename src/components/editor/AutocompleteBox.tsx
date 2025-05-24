import { Component } from "solid-js";

export type SuggestionItem = {
  label: string;
  kind: string;
};

type AutocompleteBoxProps = {
  suggestions: SuggestionItem[];
  selectedIndex: number;
  onSelect: (label: string) => void;
};

const AutocompleteBox: Component<AutocompleteBoxProps> = (props) => {
  return (
    <div class="autocomplete-box">
      {props.suggestions.map((item, index) => (
        <div
          class={`autocomplete-item ${
            index === props.selectedIndex ? "selected" : ""
          }`}
          onMouseDown={() => props.onSelect(item.label)}
        >
          <span class="suggestion-label">{item.label}</span>
          <span class="suggestion-type">{item.kind}</span>
        </div>
      ))}
    </div>
  );
};

export default AutocompleteBox;
