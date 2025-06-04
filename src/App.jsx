import React from "react";
import { HashRouter } from "react-router-dom";
import { GameProvider } from "./components/contexts/GameContext";
import AnimatedRoutes from "./routes/AnimatedRoutes";

const App = () => {
  return (
    <GameProvider>
      <HashRouter>
        <div className="min-h-screen flex flex-col">
          <AnimatedRoutes />
        </div>
      </HashRouter>
    </GameProvider>
  );
};

export default App;
