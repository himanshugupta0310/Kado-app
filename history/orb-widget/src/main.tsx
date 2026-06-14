import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Orb, type AgentState } from "./components/orb";

declare global {
  interface Window {
    KadoOrb?: {
      setAgentState: (state: AgentState) => void;
    };
  }
}

function App() {
  const [agentState, setAgentState] = useState<AgentState>(null);

  useEffect(() => {
    window.KadoOrb = { setAgentState };
    return () => {
      delete window.KadoOrb;
    };
  }, []);

  return (
    <Orb
      colors={["#8ff0d4", "#2d8a6a"]}
      agentState={agentState}
      className="orb-canvas"
    />
  );
}

const root = document.getElementById("orb-root");
if (root) createRoot(root).render(<App />);
