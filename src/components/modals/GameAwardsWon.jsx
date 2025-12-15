import { useGame } from "../../contexts/GameContext";
import Modal from "./Modal";
import { Link } from "react-router-dom";

const GameAwardsWon = ({ game, isOpen, onClose }) => {
  const { awardsPerGame } = useGame();

  if (!isOpen) return null;

  return (
    <Modal title={"Awards won by " + game.name} onClose={onClose}>
      {!awardsPerGame?.[game.id] || awardsPerGame[game.id].length === 0 ? (
        <div className="text-sm opacity-80">
          No awards found for this game yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {awardsPerGame[game.id].map((award) => (
            <div
              key={`${award.year}-${award.slug}`}
              className="rounded-lg bg-background border-primary shadow-md transition"
            >
              <div className="flex flex-col gap-5 px-4 py-3">
                <div className="flex items-start gap-3">
                  <div>
                    <div className="text-md font-semibold">{award.title}</div>
                    <div className="text-sm opacity-70">The Game Awards {award.year}</div>
                  </div>
                </div>

                <button
                  className="bg-gradient-primary text-sm px-3 py-1.5 rounded-md hover:scale-105 transition w-fit"
                >
                  <Link
                    to={`/game-awards-history/${award.year}/${award.slug}`}
                    onClick={onClose}
                  >
                    Go to award
                  </Link>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
};

export default GameAwardsWon;
