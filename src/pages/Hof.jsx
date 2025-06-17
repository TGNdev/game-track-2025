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
            <ol className="relative space-y-12">
              {[...ratedGames]
                .sort((a, b) => {
                  const aCritic = a.ratings.critics;
                  const bCritic = b.ratings.critics;
                  if (bCritic !== aCritic) return bCritic - aCritic;

                  const aPlayer = a.ratings.players;
                  const bPlayer = b.ratings.players;
                  return bPlayer - aPlayer;
                })
                .map((game, idx) => {
                  const rank = idx + 1;
                  const isPodium = rank <= 3;

                  return (
                    <li
                      key={game.id}
                      className={`bg-white rounded-lg shadow-md h-40 p-5 flex flex-col md:items-center md:flex-row gap-4 md:gap-6 hover:shadow-lg transition-shadow ${isPodium ? "relative" : ""}`}
                      style={{
                        backgroundImage: game.cover ? `url(${game.cover})` : undefined,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        backgroundRepeat: "no-repeat",
                        position: "relative",
                        zIndex: 0,
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          background: "rgba(255,255,255,0.70)",
                          zIndex: 1,
                          borderRadius: "inherit",
                        }}
                      />
                      <div style={{ position: "relative", zIndex: 2 }} className="flex w-full items-center gap-4 md:gap-6">
                        {isPodium ? (
                          <div
                            className="flex flex-col items-center justify-center select-none"
                            style={{
                              width: rank === 1 ? 60 : 50,
                              height: rank === 1 ? 100 : 80,
                              marginBottom: rank === 1 ? -12 : -4,
                            }}
                          >
                            <div
                              className={`font-extrabold ${podiumColors[rank]} text-center rounded-full border-2 px-2 py-1`}
                              style={{
                                fontSize: rank === 1 ? 36 : 28,
                                lineHeight: 1,
                              }}
                            >
                              #{rank}
                            </div>
                          </div>
                        ) : (
                          <span className="text-lg font-bold text-gray-400 w-10 text-center select-none">
                            #{rank}
                          </span>
                        )}
                        <div className="flex-1 min-w-0">
                          <a
                            target="_blank"
                            rel="noreferrer"
                            href={game.link}
                            className="font-semibold text-xl hover:scale-110 transition"
                          >
                            {game.name}
                          </a>
                          <div className="text-gray-500">
                            {game.developers.map((dev, index) => (
                              <div key={`featured-${dev.name}`} className="font-semibold">
                                {dev.name}
                                {index < game.developers.length - 2
                                  ? ", "
                                  : index === game.developers.length - 2
                                    ? " & "
                                    : ""}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex flex-col items-end space-y-1 text-sm text-gray-700 min-w-[100px]">
                          <div>
                            <span className="font-semibold text-indigo-600">
                              Critics:
                            </span>{" "}
                            {game.ratings.critics}
                          </div>
                          <div>
                            <span className="font-semibold text-indigo-600">
                              Players:
                            </span>{" "}
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
