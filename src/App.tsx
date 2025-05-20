import { createSignal, type Component } from "solid-js";
import Graph from "./components/Graph";
import CypherEditor from "./components/editor/CypherEditor";

const App: Component = () => {
  const [graphData, setGraphData] = createSignal<any[]>([]);

  return (
    <>
      <CypherEditor onQueryResult={setGraphData} />
      <Graph data={graphData()} />
    </>
  );
};

export default App;
