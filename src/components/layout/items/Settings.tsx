import { SettingsIcon } from "lucide-solid";
import { onCleanup, onMount } from "solid-js";
import { useSetting } from "../../../store/settings";

const Toggle = (props: {
  label: string;
  value: () => boolean;
  onToggle: () => void;
}) => {
  return (
    <button
      onClick={props.onToggle}
      class="flex items-center justify-between w-full py-2 px-3 rounded-lg hover:bg-gray-100 transition"
    >
      <span class="text-gray-800 font-medium">{props.label}</span>
      <span
        class={`relative w-10 h-6 flex items-center rounded-full p-1 transition-colors duration-300 ${
          props.value() ? "bg-blue-500" : "bg-gray-300"
        }`}
      >
        <span
          class={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
            props.value() ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </span>
    </button>
  );
};

const Settings = (props: { onClose: () => void }) => {
  let popupRef: HTMLDivElement | undefined;

  const zoomSetting = useSetting("requireCtrlForZoom");
  const autocompleteSetting = useSetting("enableAutocomplete");
  const minimapSetting = useSetting("enableMinimap");

  const handleClickOutside = (event: MouseEvent) => {
    if (popupRef && !popupRef.contains(event.target as Node)) {
      props.onClose();
    }
  };

  onMount(() => {
    document.addEventListener("mousedown", handleClickOutside);
  });

  onCleanup(() => {
    document.removeEventListener("mousedown", handleClickOutside);
  });

  return (
    <div
      ref={popupRef}
      class="absolute bottom-20 left-1/2 -translate-x-1/2 z-50 w-96 bg-white/90 backdrop-blur-md border border-gray-300 rounded-xl shadow-xl p-5 animate-slide-up text-sm text-gray-800 max-h-[70vh] overflow-y-auto"
    >
      <h3 class="font-semibold text-gray-700 mb-4 flex items-center gap-2">
        <SettingsIcon class="w-4 h-4" />
        Einstellungen
      </h3>

      <div class="space-y-4">
        <section>
          <h4 class="text-xs font-bold text-gray-500 uppercase mb-1">
            Interaktionen
          </h4>

          <Toggle
            label="Zoom nur mit STRG"
            value={zoomSetting.get}
            onToggle={() => zoomSetting.set(!zoomSetting.get())}
          />

          <Toggle
            label="Minimap anzeigen"
            value={minimapSetting.get}
            onToggle={() => minimapSetting.set(!minimapSetting.get())}
          />
        </section>
        <section>
          <h4 class="text-xs font-bold text-gray-500 uppercase mb-1">Editor</h4>

          <Toggle
            label="Autocomplete aktivieren"
            value={autocompleteSetting.get}
            onToggle={() => autocompleteSetting.set(!autocompleteSetting.get())}
          />
        </section>
      </div>
    </div>
  );
};

export default Settings;
