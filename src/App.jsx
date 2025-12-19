import { HashRouter } from "react-router-dom";
import { GameProvider } from "./contexts/GameProvider";
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
