import { useEffect, useState } from "react";
import Layout from "../components/shared/Layout";
import { getGamesFromFirestore } from "../js/firebase";
import { useGame } from "../contexts/GameContext";
import he from 'he';
import { highlightMatch } from "../js/utils";

const Hof = () => {
  const [games, setGames] = useState([]);
  const {
    search,
  } = useGame();

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const gamesList = await getGamesFromFirestore();
        setGames(gamesList);
      } catch (error) {
        console.error("Error fetching games:", error);
      }
    };

    fetchGames();
  }, []);

  const uniqueGamesMap = new Map();
  games.forEach(game => {
    if (!uniqueGamesMap.has(game.name)) {
      uniqueGamesMap.set(game.name, game);
    }
  });
  const uniqueGames = Array.from(uniqueGamesMap.values());

  const ratedGames = uniqueGames.filter(
    (game) =>
      game.ratings.critics > 0 &&
      game.ratings.players > 0
  );

  const filteredRatedGames = ratedGames.filter(game =>
    game.name.toLowerCase().includes(search.toLowerCase()) ||
    game.developers.some(dev => dev.name.toLowerCase().includes(search.toLowerCase()))
  );

  const podiumColors = {
    1: "text-yellow-500 border-yellow-500",
    2: "text-gray-400 border-gray-400",
    3: "text-amber-700 border-amber-700",
  };

  const unratedCount = games.length - ratedGames.length;

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col gap-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Game Track's Hall Of Fame</h2>
          <p className="text-sm italic text-slate-500">
            Based on{" "}
            <span className="font-semibold">{ratedGames.length}</span>{" "}
            eligible games on{" "}
            <span className="font-semibold">{process.env.REACT_APP_TITLE}</span>
          </p>
        </div>
        <div>
          {unratedCount > 0 && (
            <p className="mb-10 text-center text-sm text-yellow-700 bg-yellow-100 rounded-md py-2 px-4">
              There {unratedCount === 1 ? "is" : "are"} still{" "}
              <span className="font-semibold">{unratedCount} game{unratedCount === 1 ? "" : "s"}</span>{" "}
              that need to receive critics or players rating.
              <br></br>
              <span className="text-xs">Also, please note that certain games here are <b>Ports or Re-releases</b> and ratings might be from the original release.</span>
            </p>
          )}

          {filteredRatedGames.length === 0 ? (
            <p className="text-center text-gray-500 text-lg">
              No rated games available yet.
            </p>
          ) : (
            <ol className="space-y-6">
              {[...filteredRatedGames]
                .sort((a, b) => {
                  const aCritics = Number(a.ratings.critics) || 0;
                  const aPlayers = Number(a.ratings.players) || 0;
                  const bCritics = Number(b.ratings.critics) || 0;
                  const bPlayers = Number(b.ratings.players) || 0;
                  const aSum = aCritics + aPlayers;
                  const bSum = bCritics + bPlayers;
                  if (bSum !== aSum) return bSum - aSum;
                  if (b.ratings.players !== a.ratings.players) return b.ratings.players - a.ratings.players;
                  return a.name.localeCompare(b.name);
                })
                .map((game, idx) => {
                  const rank = idx + 1;
                  const isPodium = rank <= 3;

                  return (
                    <li
                      key={game.id}
                      className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col md:flex-row transition hover:shadow-lg relative"
                    >
                      {/* Image side */}
                      <div className="w-full md:w-2/5 h-48 relative">
                        <img
                          src={game.cover}
                          alt={`${game.name} cover`}
                          className="w-full h-full object-cover rounded-lg"
                        />
                        {isPodium ? (
                          <div
                            className={`absolute top-2 left-2 z-10 font-extrabold text-xl px-4 py-1.5 rounded-full border-2 ${podiumColors[rank]}`}
                            style={{
                              backdropFilter: "blur(3px)",
                              backgroundColor: "rgba(255, 255, 255, 0.5)",
                              boxShadow: "0 2px 6px rgba(0, 0, 0, 0.3)",
                            }}
                          >
                            #{rank}
                          </div>
                        ) : (
                          <div
                            className="absolute top-1 left-1 z-10 text-sm px-1 py-0.5 rounded-full border-2"
                            style={{
                              backgroundColor: "rgba(255, 255, 255, 0.5)",
                              boxShadow: "0 2px 6px rgba(0, 0, 0, 0.2)",
                            }}
                          >
                            #{rank}
                          </div>
                        )}
                      </div>

                      {/* Info side */}
                      <div className="flex-1 p-5 flex flex-col justify-between gap-4">
                        <div className="flex flex-col gap-2">
                          <a
                            href={game.link}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xl font-semibold hover:scale-105 transition"
                          >
                            {highlightMatch(he.decode(game.name), search)}
                          </a>
                          <div className="text-xs text-gray-600">
                            By {game.developers.map((dev, index) => (
                              <span key={dev.name}>
                                <span className="font-semibold text-sm">
                                  {highlightMatch(he.decode(dev.name), search)}
                                </span>
                                {index < game.developers.length - 2
                                  ? ", "
                                  : index === game.developers.length - 2
                                    ? " & "
                                    : ""}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex flex-row justify-between text-base text-gray-700">
                          <div>
                            <span className="text-primary">Critics:</span>{" "}
                            <span className="font-semibold">{game.ratings.critics}</span>
                          </div>
                          <div>
                            <span className="text-primary">Players:</span>{" "}
                            <span className="font-semibold">{game.ratings.players}</span>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
            </ol>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Hof;
