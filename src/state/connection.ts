import { createSignal } from "solid-js";
import neo4j, { Driver, ServerInfo } from "neo4j-driver";

const [driverInstance, setDriverInstance] = createSignal<Driver | null>(null);
const [isConnected, setIsConnected] = createSignal(false);
const [serverInfo, setServerInfo] = createSignal<ServerInfo | null>(null);
const [connectionDetails, setConnectionDetails] = createSignal<{
  uri: string;
  user: string;
  password: string;
} | null>(null);

export async function connectToNeo4j(
  uri: string,
  user: string,
  password: string
) {
  try {
    const newDriver = neo4j.driver(uri, neo4j.auth.basic(user, password));
    const info = await newDriver.getServerInfo();
    setDriverInstance(newDriver);
    setIsConnected(true);

    setServerInfo(info);
    setIsConnected(true);
    setConnectionDetails({ uri, user, password });

    localStorage.setItem(
      "neo4j-connection",
      JSON.stringify({ uri, user, password })
    );
  } catch (err) {
    setDriverInstance(null);
    setServerInfo(null);
    setConnectionDetails(null);
    setIsConnected(false);
    throw err;
  }
}

export async function restoreNeo4jConnection() {
  const raw = localStorage.getItem("neo4j-connection");
  if (!raw) return;

  try {
    const { uri, user, password } = JSON.parse(raw);
    await connectToNeo4j(uri, user, password);
  } catch (err) {
    localStorage.removeItem("neo4j-connection");
  }
}

export async function disconnectNeo4j() {
  if (driverInstance()) {
    await driverInstance()!.close();
    setDriverInstance(null);
    setServerInfo(null);
    setConnectionDetails(null);
    setIsConnected(false);
    localStorage.removeItem("neo4j-connection");
  }
}

export { driverInstance, isConnected, serverInfo, connectionDetails };
