import { SettingsIcon } from "lucide-solid";
import { onCleanup, onMount } from "solid-js";
import { useSetting } from "../../../store/settings";

const Settings = (props: { onClose: () => void }) => {
  let popupRef: HTMLDivElement | undefined;

  const zoomSetting = useSetting("requireCtrlForZoom");

  const handleClickOutside = (event: MouseEvent) => {
    if (popupRef && !popupRef.contains(event.target as Node)) {
      props.onClose();
    }
  };

  onMount(async () => {
    document.addEventListener("mousedown", handleClickOutside);
  });

  onCleanup(() =>
    document.removeEventListener("mousedown", handleClickOutside)
  );

  return (
    <div
      ref={popupRef}
      class="absolute bottom-20 left-1/2 -translate-x-1/2 z-50 w-96 bg-white/90 backdrop-blur-md border border-gray-300 rounded-xl shadow-xl p-5 animate-slide-up text-sm text-gray-800 max-h-[70vh] overflow-y-auto"
    >
      <h3 class="font-semibold text-gray-700 mb-4 flex items-center gap-2">
        <SettingsIcon class="w-4 h-4" />
        Settings
      </h3>

      <div class="space-y-4">
        <section>
          <h4 class="text-xs font-bold text-gray-500 uppercase mb-1">
            Interaktionen
          </h4>
          <div class="flex items-center justify-between py-1">
            <label class="flex items-center gap-2 text-gray-700">
              <input
                type="checkbox"
                checked={zoomSetting.get()}
                onChange={(e) => zoomSetting.set(e.currentTarget.checked)}
              />
              Zoom nur mit STRG
            </label>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Settings;
