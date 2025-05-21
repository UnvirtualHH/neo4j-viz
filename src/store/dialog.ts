import { JSX } from "solid-js/h/jsx-runtime";
import { createStore } from "solid-js/store";

type TrayDialog = {
  id: string;
  title: string;
  icon?: JSX.Element; // optional für individuelles Symbol
  restore: () => void;
};

const [trayDialogs, setTrayDialogs] = createStore<TrayDialog[]>([]);

function addToTray(dialog: TrayDialog) {
  setTrayDialogs((prev) => [...prev.filter((d) => d.id !== dialog.id), dialog]);
}

function removeFromTray(id: string) {
  setTrayDialogs((prev) => prev.filter((d) => d.id !== id));
}

export { trayDialogs, addToTray, removeFromTray };
