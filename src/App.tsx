import type { Component } from "solid-js";

import styles from "./App.module.css";
import CypherEditor from "./CypherEditor";

const App: Component = () => {
  return (
    <div class={styles.App}>
      <CypherEditor />
    </div>
  );
};

export default App;
