import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { getGamesFromFirestore } from "../js/firebase";

const Hof = () => {
  const [games, setGames] = useState([]);

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
      game.ratings.critics > 0 ||
      game.ratings.players > 0
  );

  const podiumColors = {
    1: "text-yellow-500 border-yellow-500",
    2: "text-gray-400 border-gray-400",
    3: "text-amber-700 border-amber-700",
  };

  const unratedCount = games.length - ratedGames.length;

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col gap-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Hall Of Fame</h2>
          <p className="text-sm italic text-slate-500">
            Based on{" "}
            <span className="font-semibold">{ratedGames.length}</span>{" "}
            eligible games on{" "}
            <span className="font-semibold">{process.env.REACT_APP_TITLE}</span>
          </p>
        </div>
        <div>
          {unratedCount > 0 && (
            <p className="mb-6 text-center text-sm text-yellow-700 bg-yellow-100 rounded-md py-2 px-4">
              There {unratedCount === 1 ? "is" : "are"} still{" "}
              <span className="font-semibold">{unratedCount}</span>{" "}
              game{unratedCount === 1 ? "" : "s"} that need to receive critics or players rating.
            </p>
          )}

          {ratedGames.length === 0 ? (
            <p className="text-center text-gray-500 text-lg">
              No rated games available yet.
            </p>
          ) : (
            <ol className="space-y-6">
              {[...ratedGames]
                .sort((a, b) => {
                  const aCritic = a.ratings.critics;
                  const bCritic = b.ratings.critics;
                  if (bCritic !== aCritic) return bCritic - aCritic;
                  const aPlayers = a.ratings.players;
                  const bPlayers = b.ratings.players;
                  if (bPlayers !== aPlayers) return bPlayers - aPlayers;
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
                      <div className="w-full md:w-1/3 h-48 md:h-auto relative">
                        <img
                          src={game.cover}
                          alt={`${game.name} cover`}
                          className="w-full h-full object-cover rounded-lg"
                        />
                        {isPodium ? (
                          <div
                            className={`absolute top-2 left-2 z-10 font-extrabold text-xl px-3 py-1 rounded-full border-2 ${podiumColors[rank]}`}
                            style={{
                              backdropFilter: "blur(2px)",
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
                              backgroundColor: "rgba(255, 255, 255, 0.3)",
                              boxShadow: "0 2px 6px rgba(0, 0, 0, 0.3)",
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
                            className="text-xl font-semibold hover:underline"
                          >
                            {game.name}
                          </a>
                          <div className="text-sm text-gray-600">
                            {game.developers.map((dev, index) => (
                              <span key={dev.name}>
                                {dev.name}
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
                            <span className="font-semibold text-indigo-600">Critics:</span>{" "}
                            {game.ratings.critics}
                          </div>
                          <div>
                            <span className="font-semibold text-indigo-600">Players:</span>{" "}
                            {game.ratings.players}
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
