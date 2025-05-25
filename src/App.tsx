import { createSignal, Show, type Component } from "solid-js";
import Graph from "./components/Graph";
import CypherEditor from "./components/editor/CypherEditor";
import BottomNav from "./components/layout/BottomNav";

import { onMount } from "solid-js";
import { restoreNeo4jConnection } from "./store/connection";
import QueryResultDialog from "./components/layout/items/QueryResults";
import AppContextProvider from "./AppContext";

const App: Component = () => {
  const [graphData, setGraphData] = createSignal<any[]>([]);
  const [queryResultData, setQueryResultData] = createSignal<any[]>([]);
  const [queryColumns, setQueryColumns] = createSignal<PropertyKey[]>([]);
  const [showQueryResult, setShowQueryResult] = createSignal(false);

  onMount(() => {
    restoreNeo4jConnection();
  });

  return (
    <AppContextProvider>
      <div class="relative w-screen h-screen overflow-hidden">
        <Graph data={graphData()} />
        <CypherEditor
          onQueryResult={(result) => {
            if (result.isGraphLike) {
              setGraphData(result.data);
            }

            const isTabular =
              result.tableRows?.length && result.columns?.length;
            if (isTabular && !result.isGraphLike) {
              setQueryResultData(result.tableRows ?? []);
              setQueryColumns(result.columns ?? []);
              setShowQueryResult(true);
            } else {
              setShowQueryResult(false);
            }
          }}
        />
        <Show when={showQueryResult()}>
          <QueryResultDialog
            data={queryResultData()}
            columns={queryColumns()}
            onClose={() => setShowQueryResult(false)}
          />
        </Show>
        <BottomNav />
      </div>
    </AppContextProvider>
  );
};

export default App;
