import {
  Eye,
  EyeOff,
  KeyRound,
  LogOut,
  Plug,
  Server,
  User,
} from "lucide-solid";
import {
  connectionDetails,
  connectToNeo4j,
  disconnectNeo4j,
  isConnected,
  serverInfo,
} from "../../../store/connection";
import { createSignal, onMount, onCleanup, Show } from "solid-js";

const Databases = (props: { onClose: () => void }) => {
  let popupRef: HTMLDivElement | undefined;

  const [uri, setUri] = createSignal("bolt://localhost:7687");
  const [username, setUsername] = createSignal("neo4j");
  const [password, setPassword] = createSignal("");
  const [error, setError] = createSignal<string | null>(null);
  const [showPassword, setShowPassword] = createSignal(false);

  const connect = async () => {
    try {
      await connectToNeo4j(uri(), username(), password());
      props.onClose();
    } catch {
      setError("Verbindung fehlgeschlagen. Bitte prüfen.");
    }
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (popupRef && !popupRef.contains(event.target as Node)) {
      props.onClose();
    }
  };

  onMount(() => document.addEventListener("mousedown", handleClickOutside));
  onCleanup(() =>
    document.removeEventListener("mousedown", handleClickOutside)
  );

  return (
    <div
      ref={popupRef}
      class="absolute bottom-20 left-1/2 -translate-x-1/2 z-50 w-80 bg-white/90 backdrop-blur-md border border-gray-300 rounded-xl shadow-xl p-5 animate-slide-up"
    >
      <Show when={isConnected()}>
        <div class="absolute top-2 right-2 w-3 h-3 rounded-full bg-green-500 border border-white" />
      </Show>
      <Show
        when={!isConnected()}
        fallback={
          <div>
            <p class="text-sm text-gray-700 mb-1 flex items-center gap-2">
              <Plug class="w-4 h-4" /> {connectionDetails()?.uri}
            </p>
            <p class="text-sm text-gray-600 mb-1 flex items-center gap-2">
              <User class="w-4 h-4" /> {connectionDetails()?.user}
            </p>
            <p class="text-sm text-gray-600 mb-1 flex items-center gap-2">
              <KeyRound class="w-4 h-4" />
              {showPassword() ? connectionDetails()?.password : "●●●●●●●●"}
              <button
                onClick={() => setShowPassword(!showPassword())}
                class="ml-auto text-gray-500 hover:text-gray-700"
              >
                {showPassword() ? (
                  <EyeOff class="w-4 h-4" />
                ) : (
                  <Eye class="w-4 h-4" />
                )}
              </button>
            </p>
            <p class="text-sm text-gray-500 mb-3 flex items-center gap-2">
              <Server class="w-4 h-4" />{" "}
              {serverInfo()?.agent ?? "unbekannter Server"}
            </p>

            <div class="flex justify-end">
              <button
                onClick={async () => {
                  await disconnectNeo4j();
                }}
                class="flex items-center gap-1 text-red-600 hover:text-red-800 text-sm"
              >
                <LogOut class="w-4 h-4" /> Verbindung trennen
              </button>
            </div>
          </div>
        }
      >
        <h3 class="text-sm font-semibold mb-3 text-gray-700">
          Verbindung herstellen
        </h3>
        <input
          class="w-full mb-2 px-3 py-2 rounded border border-gray-300 text-sm"
          placeholder="Bolt URI"
          value={uri()}
          onInput={(e) => setUri(e.currentTarget.value)}
        />
        <input
          class="w-full mb-2 px-3 py-2 rounded border border-gray-300 text-sm"
          placeholder="Benutzername"
          value={username()}
          onInput={(e) => setUsername(e.currentTarget.value)}
        />
        <input
          type="password"
          class="w-full mb-3 px-3 py-2 rounded border border-gray-300 text-sm"
          placeholder="Passwort"
          value={password()}
          onInput={(e) => setPassword(e.currentTarget.value)}
        />

        {error() && <div class="text-red-600 text-sm mb-2">{error()}</div>}

        <div class="flex justify-end gap-2 text-sm">
          <button
            onClick={props.onClose}
            class="text-gray-500 hover:text-gray-700"
          >
            Abbrechen
          </button>
          <button
            onClick={connect}
            class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
          >
            Verbinden
          </button>
        </div>
      </Show>
    </div>
  );
};

export default Databases;
