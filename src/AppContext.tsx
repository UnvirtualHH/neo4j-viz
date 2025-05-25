import {
  Flatten,
  flatten,
  Translator,
  translator,
} from "@solid-primitives/i18n";
import {
  createContext,
  createResource,
  createSignal,
  ParentComponent,
  Suspense,
  useContext,
} from "solid-js";
import de from "./i18n/de.json";

export type Locale = "en" | "de";
export type RawDictionary = typeof de;
export type Dictionary = Flatten<RawDictionary>;

const LOCALE_KEY = "locale";

function initialLocale(): Locale {
  let locale: Locale | undefined;

  locale = localStorage.getItem(LOCALE_KEY) as Locale;
  if (locale) return locale;

  locale = navigator.language.slice(0, 2) as Locale;
  if (locale) return locale;

  locale = navigator.language.toLocaleLowerCase() as Locale;
  if (locale) return locale;

  return "en";
}

async function fetchDictionary(locale: Locale): Promise<Dictionary> {
  const dict: RawDictionary = await import(`./i18n/${locale}.json`);
  return flatten(dict);
}

interface AppState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translator<Dictionary>;
}

const AppContext = createContext<AppState>({} as AppState);

export const useAppContext = () => useContext(AppContext);

const AppContextProvider: ParentComponent = (props) => {
  const [locale, setLocale] = createSignal<Locale>(initialLocale());

  localStorage.setItem(LOCALE_KEY, locale());

  const [dict] = createResource(locale, fetchDictionary, {
    initialValue: flatten(de),
  });

  const t = translator(dict);

  const state: AppState = {
    get locale() {
      return locale();
    },
    setLocale: (newLocale: Locale) => {
      setLocale(newLocale);
      localStorage.setItem(LOCALE_KEY, newLocale);
    },
    t,
  };

  return (
    <Suspense>
      <AppContext.Provider value={state}>{props.children}</AppContext.Provider>
    </Suspense>
  );
};

export default AppContextProvider;
