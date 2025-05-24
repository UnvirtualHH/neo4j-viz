import { createSignal } from "solid-js";

export type AppSettings = {
  requireCtrlForZoom: boolean;
  enableMinimap: boolean;
  enableAutocomplete: boolean;
};

const DEFAULT_SETTINGS: AppSettings = {
  requireCtrlForZoom: true,
  enableMinimap: true,
  enableAutocomplete: true,
};

function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem("appSettings");
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function persist(settings: AppSettings) {
  localStorage.setItem("appSettings", JSON.stringify(settings));
}

const [settings, setSettings] = createSignal<AppSettings>(loadSettings());

function updateSetting<K extends keyof AppSettings>(
  key: K,
  value: AppSettings[K]
) {
  const next = { ...settings(), [key]: value };
  setSettings(next);
  persist(next);
}

function useSetting<K extends keyof AppSettings>(key: K) {
  return {
    get: () => settings()[key],
    set: (val: AppSettings[K]) => updateSetting(key, val),
  };
}

export { settings, updateSetting, useSetting };
