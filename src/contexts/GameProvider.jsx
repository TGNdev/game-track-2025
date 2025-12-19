import { GameDataProvider } from "./GameDataContext";
import { GameUIProvider } from "./GameUIContext";

export const GameProvider = ({ children }) => {
  return (
    <GameDataProvider>
      <GameUIProvider>{children}</GameUIProvider>
    </GameDataProvider>
  );
};
