import { type Component } from "solid-js";
import Graph from "./components/Graph";

import CypherEditor from "./components/editor/CypherEditor";

const App: Component = () => {
  return (
    <>
      <CypherEditor />
      <Graph />
    </>
  );
};

export default App;
