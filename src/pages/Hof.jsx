import { useEffect, useState } from "react";
import Layout from "../components/shared/Layout";
import { getGamesFromFirestore } from "../js/firebase";
import he from 'he';
import { highlightMatch } from "../js/utils";
import { getGameCovers } from "../js/igdb";
import { useGameData } from "../contexts/GameDataContext";
import { useGameUI } from "../contexts/GameUIContext";

const Hof = () => {
  const [games, setGames] = useState([]);
  const { coverMap, setCoverMap } = useGameData();
  const { search } = useGameUI();

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

  useEffect(() => {
    const fetchCovers = async () => {
      if (games.length === 0) return;
      const gameIds = games.map((g) => g.igdb_id);
      const covers = await getGameCovers(gameIds);
      setCoverMap(covers);
    };
    fetchCovers();
  }, [games, setCoverMap]);

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

  const sortedRatedGames = [...ratedGames].sort((a, b) => {
    const aCritics = Number(a.ratings.critics) || 0;
    const aPlayers = Number(a.ratings.players) || 0;
    const bCritics = Number(b.ratings.critics) || 0;
    const bPlayers = Number(b.ratings.players) || 0;
    const aSum = aCritics + aPlayers;
    const bSum = bCritics + bPlayers;
    if (bSum !== aSum) return bSum - aSum;
    if (b.ratings.players !== a.ratings.players) return b.ratings.players - a.ratings.players;
    return a.name.localeCompare(b.name);
  });

  const rankedGames = sortedRatedGames.map((game, index) => ({
    ...game,
    rank: index + 1,
  }));

  const filteredRankedGames = rankedGames.filter(game =>
    game.name.toLowerCase().includes(search.toLowerCase()) ||
    game.developers.some(dev => dev.name.toLowerCase().includes(search.toLowerCase())) ||
    game.editors.some(editor => editor.name.toLowerCase().includes(search.toLowerCase()))
  );

  const podiumColors = {
    1: "text-yellow-500 border-yellow-500",
    2: "text-gray-400 border-gray-400",
    3: "text-amber-700 border-amber-700",
  };

  const unratedCount = games.length - ratedGames.length;

  return (
    <Layout>
      <div className="max-w-5xl mx-auto py-6 px-6 flex flex-col gap-4">
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
              <br />
              <span className="text-xs">Also, please note that certain games here are <b>Ports or Re-releases</b> and ratings might be from the original release.</span>
            </p>
          )}

          <ol className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredRankedGames.map((game) => {
              const rank = game.rank;
              const cover = coverMap ? coverMap[game.igdb_id] : [];
              const isTopGame = rank === 1;
              const isPodium = rank <= 3;

              return (
                <li
                  key={game.id}
                  className={`bg-white rounded-lg shadow-md overflow-hidden flex transition hover:shadow-lg relative ${isTopGame ? "md:col-span-2 border-tertiary" : ""
                    }`}
                >
                  {/* Image side */}
                  <div className={`relative ${isTopGame ? "h-64" : "h-48"} relative`}>
                    <img
                      src={cover}
                      alt={`${game.name} cover`}
                      className="w-full h-full object-cover rounded-l-md"
                    />
                    <div
                      className={`absolute top-2 left-2 z-10 font-extrabold ${isPodium ? "text-xl px-4 py-1.5" : "text-sm px-2 py-0.5"} rounded-full border-2 ${podiumColors[rank] || ""}`}
                      style={{
                        backdropFilter: "blur(3px)",
                        backgroundColor: "rgba(255, 255, 255, 0.5)",
                        boxShadow: "0 2px 6px rgba(0, 0, 0, 0.3)",
                      }}
                    >
                      #{rank}
                    </div>
                  </div>

                  {/* Info side */}
                  <div className={`p-5 flex flex-col justify-between gap-4 ${isTopGame ? "w-2/3" : "flex-1"}`}>
                    <div className="flex flex-col gap-2">
                      <a
                        href={game.link}
                        target="_blank"
                        rel="noreferrer"
                        className={`font-semibold hover:scale-105 transition ${isTopGame ? "text-2xl" : "text-xl"}`}
                      >
                        {highlightMatch(he.decode(game.name), search)}
                      </a>
                      <div className="text-xs text-gray-600">
                        By{" "}
                        {game.developers.map((dev, index) => (
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
        </div>
      </div>
    </Layout>
  );
};

export default Hof;
