import { SettingsIcon } from "lucide-solid";
import { onCleanup, onMount } from "solid-js";

const Settings = (props: { onClose: () => void }) => {
  let popupRef: HTMLDivElement | undefined;

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
    </div>
  );
};

export default Settings;
