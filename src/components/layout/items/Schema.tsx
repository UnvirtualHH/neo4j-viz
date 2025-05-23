import { createSignal, For, onCleanup, onMount, Show } from "solid-js";
import { getFullSchema } from "../../../service/cypher";
import { BookOpen, Circle, Tags, Workflow } from "lucide-solid";
import { DbSchema } from "../../../types/schema";

const SchemaInfo = (props: { onClose: () => void }) => {
  const [schema, setSchema] = createSignal<DbSchema | null>(null);

  let popupRef: HTMLDivElement | undefined;

  const handleClickOutside = (event: MouseEvent) => {
    if (popupRef && !popupRef.contains(event.target as Node)) {
      props.onClose();
    }
  };

  onMount(async () => {
    document.addEventListener("mousedown", handleClickOutside);
    try {
      const data = await getFullSchema();
      setSchema(data);
    } catch (e) {
      console.error("Fehler beim Laden des Schemas", e);
    }
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
        <BookOpen class="w-4 h-4" />
        Datenbankschema
      </h3>

      <Show when={schema()} fallback={<p>Lade Schema...</p>}>
        {(s) => (
          <>
            <div class="mb-4">
              <h4 class="font-semibold text-gray-600 mb-1 flex items-center gap-2">
                <Circle class="w-4 h-4" />
                Knotenlabels ({s().labels?.length})
              </h4>
              <ul class="list-disc list-inside space-y-0.5 text-gray-700">
                <For each={s().labels}>{(label) => <li>{label}</li>}</For>
              </ul>
            </div>

            <div class="mb-4">
              <h4 class="font-semibold text-gray-600 mb-1 flex items-center gap-2">
                <Workflow class="w-4 h-4" />
                Beziehungen ({s().relationshipTypes?.length})
              </h4>
              <ul class="list-disc list-inside space-y-0.5 text-gray-700">
                <For each={s().relationshipTypes}>
                  {(type) => <li>{type}</li>}
                </For>
              </ul>
            </div>

            <div>
              <h4 class="font-semibold text-gray-600 mb-1 flex items-center gap-2">
                <Tags class="w-4 h-4" />
                Properties ({s().propertyKeys?.length})
              </h4>
              <ul class="list-disc list-inside space-y-0.5 text-gray-700">
                <For each={s().propertyKeys}>{(key) => <li>{key}</li>}</For>
              </ul>
            </div>
          </>
        )}
      </Show>
    </div>
  );
};

export default SchemaInfo;
