
import type { Component } from "solid-js";

import CypherEditor from "./CypherEditor";
import Graph from "./components/Graph";

const App: Component = () => {
  return (
    <>
      <CypherEditor />
      <Graph />
    </>
  );
};

export default App;
