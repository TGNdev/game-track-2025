import { Timestamp } from "firebase/firestore";
import { useState, useEffect } from "react";
import FeaturedGame from "./FeaturedGame";
import { useGame } from "../../contexts/GameContext";

const FeaturedGames = ({ games }) => {
  const [showAll, setShowAll] = useState(false);
  const [columns, setColumns] = useState(3);
  const {
    coverMap
  } = useGame();

  const releaseMessage = releaseDate => {
    const today = new Date();
    const release = new Date(releaseDate.seconds * 1000);
    const diffTime = release - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    var text = "Releases ";
    var classes = "px-2 py-1 sm:px-4 text-sm sm:text-base rounded-full font-semibold text-center ";

    if (diffDays === 0) {
      text += "today !";
      classes += "bg-green-200 text-green-700"
    }

    if (diffDays === 1) {
      text += "tomorrow";
      classes += "bg-amber-200 text-amber-700"
    }

    if (diffDays > 1) {
      text += `in ${diffDays} days`;
      classes += "bg-amber-200 text-amber-700"
    }

    return <span className={`${classes}`}>
      {text}
    </span>
  };

  const featuredGames = (() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let minDiffTime = Infinity;
    games.forEach(game => {
      if (game.release_date instanceof Timestamp) {
        const release = new Date(game.release_date.seconds * 1000);
        release.setHours(0, 0, 0, 0);
        const diffTime = release - today;
        if (diffTime >= 0 && diffTime < minDiffTime) {
          minDiffTime = diffTime;
        }
      }
    });

    return games.filter(game => {
      if (game.release_date instanceof Timestamp) {
        const release = new Date(game.release_date.seconds * 1000);
        release.setHours(0, 0, 0, 0);
        const diffTime = release - today;
        return diffTime === minDiffTime && diffTime >= 0;
      }
      return false;
    })
      .sort((a, b) => a.name.localeCompare(b.name));
  })();

  useEffect(() => {
    const updateColumns = () => {
      const width = window.innerWidth;
      if (width < 640) setColumns(1);
      else if (width < 1024) setColumns(2);
      else setColumns(3);
    };

    updateColumns();
    window.addEventListener("resize", updateColumns);
    return () => window.removeEventListener("resize", updateColumns);
  }, []);

  // Split featuredGames into first row and the rest
  const firstRow = featuredGames.slice(0, columns);
  const otherRows = featuredGames.slice(columns);

  return (
    <div className="w-full border rounded-xl p-4">
      <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-between mb-4">
        <div className="text-2xl font-semibold italic text-center sm:text-left">
          {games.length > 1 ? "Next Releases" : "Next Release"}
        </div>
        <div className="sm:ml-auto">
          {firstRow.length > 0 && releaseMessage(firstRow[0].release_date)}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
        {firstRow.map(featured => (
          <FeaturedGame
            key={featured.id}
            featured={featured}
            cover={coverMap ? coverMap[featured.igdb_id] : []}
          />
        ))}
      </div>
      {showAll && (
        <div className="w-full max-h-[400px] overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 my-4">
          {otherRows.map(featured => (
            <FeaturedGame
              key={featured.id}
              featured={featured}
              cover={coverMap ? coverMap[featured.igdb_id] : []}
            />
          ))}
        </div>
      )}
      {otherRows.length > 0 && (
        <div className="flex justify-center mt-4">
          <button
            onClick={() => setShowAll(!showAll)}
            className="bg-gray-200 text-gray-700 px-3 py-1.5 rounded hover:bg-gray-300 transition"
          >
            {showAll ? "Show Less" : `Show ${otherRows.length} more games`}
          </button>
        </div>
      )}
    </div>
  )
}

export default FeaturedGames;