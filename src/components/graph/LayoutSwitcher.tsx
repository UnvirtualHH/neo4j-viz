import { Orbit, TreeDeciduous, Zap } from "lucide-solid";
import { Component } from "solid-js";

export type LayoutType = "force" | "euler" | "tree";

type LayoutSwitcherProps = {
  onSelectLayout: (layout: LayoutType) => void;
  selected: LayoutType;
};

const LayoutSwitcher: Component<LayoutSwitcherProps> = (props) => {
  const layouts: { id: LayoutType; label: string; icon: typeof Zap }[] = [
    { id: "force", label: "Force Layout", icon: Zap },
    { id: "euler", label: "Euler Physics", icon: Orbit },
    { id: "tree", label: "Tree Layout", icon: TreeDeciduous },
  ];

  return (
    <div class="absolute top-3 left-3 z-50 flex flex-col bg-white/90 rounded-md shadow p-1 gap-1">
      {layouts.map(({ id, label, icon: Icon }) => (
        <button
          class={`w-8 h-8 flex items-center justify-center rounded ${
            props.selected === id
              ? "bg-blue-500 text-white"
              : "bg-gray-100 hover:bg-gray-200 text-gray-700"
          }`}
          title={label}
          onClick={() => props.onSelectLayout(id)}
        >
          <Icon size={18} stroke-width={1.5} />
        </button>
      ))}
    </div>
  );
};

export default LayoutSwitcher;
