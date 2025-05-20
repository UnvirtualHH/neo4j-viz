import { Clock, Database, Home, Settings, Star } from "lucide-solid";
import { createSignal, Show } from "solid-js";
import { isConnected } from "../../state/connection";
import Databases from "./Databases";

const BottomNav = () => {
  const [active, setActive] = createSignal("home");
  const [showDatabases, setShowDatabases] = createSignal(false);

  const navItems = [
    { id: "home", icon: Home, tooltip: "Query" },
    { id: "favorites", icon: Star, tooltip: "Favoriten" },
    {
      id: "connections",
      icon: Database,
      tooltip: "Verbindungen",
      action: () => setShowDatabases(true),
    },
    { id: "history", icon: Clock, tooltip: "Verlauf" },
    { id: "settings", icon: Settings, tooltip: "Einstellungen" },
  ];

  return (
    <>
      <Show when={showDatabases()}>
        <Databases onClose={() => setShowDatabases(false)} />
      </Show>

      <div class="fixed bottom-2 left-1/2 -translate-x-1/2 z-50 bg-white/70 backdrop-blur-md border border-gray-300 rounded-2xl shadow-md px-4 py-1 flex gap-6">
        {navItems.map(({ id, icon: Icon, tooltip, action }) => (
          <button
            onClick={() => {
              setActive(id);
              if (action) action();
            }}
            class={`relative group p-2 ${
              active() === id ? "text-blue-600" : "text-gray-500"
            }`}
          >
            <div class="relative">
              <Icon class="w-5 h-5" />
              {id === "connections" && (
                <div
                  class={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border border-white transition-opacity ${
                    isConnected() ? " bg-green-500" : "bg-red-500"
                  }`}
                />
              )}
            </div>

            <span class="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 text-xs bg-black text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition">
              {tooltip}
            </span>
          </button>
        ))}
      </div>
    </>
  );
};

export default BottomNav;
