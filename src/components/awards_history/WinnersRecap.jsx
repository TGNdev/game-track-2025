import { useMemo, useState } from "react";

const WinnersRecap = ({ tga, getGameById }) => {
  const [visible, setVisible] = useState(false);

  const gameAwardCounts = useMemo(() => {
    const counts = {};
    tga.forEach((year) => {
      year.awards.forEach((award) => {
        if (award.nominees && award.nominees.length > 0) {
          const winner = award.nominees.find(nominee => nominee.isWinner);
          if (winner && winner.gameId) {
            counts[winner.gameId] = (counts[winner.gameId] || 0) + 1;
          } else {
            console.warn("No winner found in nominees for:", award.name);
          }
        }

        if (award.gameId) {
          counts[award.gameId] = (counts[award.gameId] || 0) + 1;
        }
      });
    });

    return Object.entries(counts)
      .map(([id, count]) => {
        const game = getGameById ? getGameById(id) : null;
        return {
          id,
          name: game?.name || "Unknown Game",
          count,
        };
      })
      .sort((a, b) => {
        if (b.count !== a.count) {
          return b.count - a.count;
        }
        return a.name.localeCompare(b.name);
      })

  }, [tga, getGameById]);

  return (
    <>
      {visible ? (
        <>
          <button
            onClick={() => setVisible(false)}
          >
            Hide Winners Recap
          </button>
          <h3 className="text-lg font-semibold mb-4">Games with Most Awards</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-300 text-left">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-2 px-4 border-b">Game</th>
                  <th className="py-2 px-4 border-b">Award Wins</th>
                </tr>
              </thead>
              <tbody>
                {gameAwardCounts.map((game) => (
                  <tr key={game.id} className="hover:bg-gray-50">
                    <td className="py-2 px-4 border-b whitespace-nowrap">{game.name}</td>
                    <td className="py-2 px-4 border-b text-center">{game.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <>
          <button
            onClick={() => setVisible(true)}
          >
            Display Winners Recap
          </button>
        </>
      )}
    </>
  )
}

export default WinnersRecap;