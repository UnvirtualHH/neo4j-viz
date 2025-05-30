import {
  AppWindow,
  Clock,
  Database,
  Home,
  Server,
  SettingsIcon,
  Star,
} from "lucide-solid";
import { createSignal, Show } from "solid-js";
import { isConnected } from "../../store/connection";
import { removeFromTray, trayDialogs } from "../../store/dialog";
import { setEditorQuery } from "../../store/query";
import Databases from "./items/Databases";
import Favorites from "./items/Favorites";
import History from "./items/History";
import SchemaInfo from "./items/Schema";
import Settings from "./items/Settings";

const BottomNav = () => {
  const [active, setActive] = createSignal("home");
  const [showDatabases, setShowDatabases] = createSignal(false);
  const [showSchema, setShowSchema] = createSignal(false);
  const [showHistory, setShowHistory] = createSignal(false);
  const [showSettings, setShowSettings] = createSignal(false);
  const [showFavorites, setShowFavorites] = createSignal(false);

  const navItems = [
    { id: "home", icon: Home, tooltip: "Query" },
    {
      id: "favorites",
      icon: Star,
      tooltip: "Favoriten",
      action: () => setShowFavorites(true),
    },
    {
      id: "connections",
      icon: Database,
      tooltip: "Verbindungen",
      action: () => setShowDatabases(true),
    },
    {
      id: "schema",
      icon: Server,
      tooltip: "Schema",
      action: () => setShowSchema(true),
    },
    {
      id: "history",
      icon: Clock,
      tooltip: "Verlauf",
      action: () => setShowHistory(true),
    },
    {
      id: "settings",
      icon: SettingsIcon,
      tooltip: "Einstellungen",
      action: () => setShowSettings(true),
    },
  ];

  return (
    <>
      <Show when={showFavorites()}>
        <Favorites
          onClose={() => setShowFavorites(false)}
          onSelect={(q) => {
            setEditorQuery(q);
            setShowFavorites(false);
          }}
        />
      </Show>

      <Show when={showDatabases()}>
        <Databases onClose={() => setShowDatabases(false)} />
      </Show>

      <Show when={showSchema()}>
        <SchemaInfo onClose={() => setShowSchema(false)} />
      </Show>

      <Show when={showHistory()}>
        <History
          onSelect={(q) => {
            setEditorQuery(q);
            setShowHistory(false);
          }}
          onClose={() => setShowHistory(false)}
        />
      </Show>

      <Show when={showSettings()}>
        <Settings onClose={() => setShowSettings(false)} />
      </Show>

      <div class="fixed bottom-2 left-1/2 -translate-x-1/2 z-50 glass rounded-2xl shadow-md px-4 py-1 flex gap-6">
        {navItems.map(({ id, icon: Icon, tooltip, action }) => (
          <button
            onClick={() => {
              setActive(id);
              if (action) action();
            }}
            class={`relative group p-2 ${
              active() === id ? "text-blue-600" : "text-white"
            }`}
          >
            <div class="relative">
              <Icon class="w-5 h-5 text-white" />
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
        <Show when={trayDialogs.length > 0}>
          <div class="flex gap-2 border-l pl-4 ml-4">
            {trayDialogs.map((d) => (
              <button
                onClick={() => {
                  d.restore();
                  removeFromTray(d.id);
                }}
                title={d.title}
                class="p-1 text-white hover:text-blue-600"
              >
                <AppWindow class="w-5 h-5" />
              </button>
            ))}
          </div>
        </Show>
      </div>
    </>
  );
};

export default BottomNav;
