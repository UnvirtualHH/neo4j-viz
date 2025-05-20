import { createSignal, type Component } from "solid-js";
import Graph from "./components/Graph";
import CypherEditor from "./components/editor/CypherEditor";
import BottomNav from "./components/layout/BottomNav";

import { onMount } from "solid-js";
import { restoreNeo4jConnection } from "./state/connection";

const App: Component = () => {
  const [graphData, setGraphData] = createSignal<any[]>([]);

  onMount(() => {
    restoreNeo4jConnection();
  });

  return (
    <div class="relative w-screen h-screen overflow-hidden">
      <Graph data={graphData()} />
      <CypherEditor onQueryResult={setGraphData} />
      <BottomNav />
    </div>
  );
};

export default App;
