import { HashRouter } from "react-router-dom";
import { GameProvider } from "./contexts/GameProvider";
import { AuthProvider } from "./contexts/AuthContext";
import AnimatedRoutes from "./routes/AnimatedRoutes";

const App = () => {
  return (
    <AuthProvider>
      <GameProvider>
        <HashRouter>
          <div className="min-h-screen flex flex-col">
            <AnimatedRoutes />
          </div>
        </HashRouter>
      </GameProvider>
    </AuthProvider>
  );
};

export default App;
