import { type Component, For, Show } from "solid-js";
import { autoDockPosition } from "../../dialog/autoDockPosition";
import FloatingDialog from "../../dialog/FloatingDialog";

type QueryResultDialogProps = {
  data: any[];
  columns: PropertyKey[];
  onClose: () => void;
  executionTimeMs?: number;
};

const QueryResultDialog: Component<QueryResultDialogProps> = (props) => {
  return (
    <FloatingDialog
      title="Query-Result"
      initialPosition={autoDockPosition("bottom-right", { width: 600 })}
      initialSize={{ width: 600, height: 300 }}
      draggable
      resizable
      closable
      minimizable
      trayable
      onClose={props.onClose}
    >
      <div class="text-sm text-gray-800 px-2 py-1 overflow-auto h-full">
        <Show
          when={props.data.length > 0}
          fallback={<p class="italic text-gray-500 py-4">Keine Ergebnisse</p>}
        >
          <table class="w-full table-auto border-collapse">
            <thead>
              <tr class="bg-gray-100 text-left text-xs uppercase text-gray-600">
                <For each={props.columns}>
                  {(col) => <th class="p-2 border-b">{col.toString()}</th>}
                </For>
              </tr>
            </thead>
            <tbody>
              <For each={props.data}>
                {(row) => (
                  <tr class="hover:bg-gray-50">
                    <For each={props.columns}>
                      {(col) => (
                        <td class="p-2 border-b font-mono break-all">
                          {JSON.stringify(row[col])}
                        </td>
                      )}
                    </For>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
          <div class="text-xs text-gray-500 mt-2">
            {props.data.length} Zeile(n){" "}
            <Show when={props.executionTimeMs}>
              &middot; {props.executionTimeMs} ms
            </Show>
          </div>
        </Show>
      </div>
    </FloatingDialog>
  );
};

export default QueryResultDialog;
