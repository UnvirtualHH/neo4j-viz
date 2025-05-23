import { type Component } from "solid-js";
import FloatingDialog from "../dialog/FloatingDialog";
import { autoDockPosition } from "./autoDockPosition";

type ConfirmDialogProps = {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
};

const ConfirmDialog: Component<ConfirmDialogProps> = (props) => {
  return (
    <FloatingDialog
      title="Bestätigen"
      initialPosition={autoDockPosition("center", { width: 300 })}
      initialSize={{ width: 300, height: 180 }}
      closable
      onClose={props.onCancel}
    >
      <div class="flex flex-col justify-between h-full p-4 text-sm">
        <p class="text-gray-800">{props.message}</p>
        <div class="flex justify-end gap-2 mt-4">
          <button
            class="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200"
            onClick={props.onCancel}
          >
            Abbrechen
          </button>
          <button
            class="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700"
            onClick={props.onConfirm}
          >
            Löschen
          </button>
        </div>
      </div>
    </FloatingDialog>
  );
};

export default ConfirmDialog;
