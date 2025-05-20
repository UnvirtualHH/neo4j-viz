import { type Component } from "solid-js";
import Graph from "./components/Graph";

import CypherEditor from "./CypherEditor";

const App: Component = () => {
  return (
    <>
      <CypherEditor />
      <Graph />
    </>
  );
};

export default App;
