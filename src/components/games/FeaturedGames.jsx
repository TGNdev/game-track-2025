import { Timestamp } from "firebase/firestore";
import { useState, useEffect, memo } from "react";
import FeaturedGame from "./FeaturedGame";
import { useGameData } from "../../contexts/GameDataContext";

const FeaturedGames = ({ games }) => {
  const [showAll, setShowAll] = useState(false);
  const [columns, setColumns] = useState(3);
  const { coverMap } = useGameData();

  const formatReleaseDate = (releaseDate) => {
    if (releaseDate instanceof Timestamp) {
      const date = new Date(releaseDate.seconds * 1000);
      return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric'
      });
    }
    return '';
  };

  const releaseMessage = releaseDate => {
    const today = new Date();
    const release = new Date(releaseDate.seconds * 1000);
    const diffTime = release - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    var text = "Releases ";
    var classes = "px-2 py-1 sm:px-4 text-sm sm:text-base rounded-full text-center flex flex-col ";

    if (diffDays === 0) {
      text += "today !";
      classes += "bg-gradient-secondary"
    }

    if (diffDays === 1) {
      text += "tomorrow";
      classes += "bg-gradient-primary"
    }

    if (diffDays > 1) {
      text += `in ${diffDays} days`;
      classes += "bg-gradient-tertiary"
    }

    return <div className={`${classes}`}>
      <p>{text}</p>
      <p className="italic text-xs font-normal">{formatReleaseDate(releaseDate)}</p>
    </div>
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

  const firstRow = featuredGames.slice(0, columns);
  const otherRows = featuredGames.slice(columns);

  return (
    <div className="w-full rounded-xl mt-6 shadow-lg">
      <div className="border-primary rounded-lg">
        <div className="p-4">
          <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-between mb-4">
            <div className="text-2xl font-bold text-primary text-center sm:text-left">
              {featuredGames.length > 1 ? "Next Releases" : "Next Release"}
            </div>
            <div className="sm:ml-auto font-semibold">
              {firstRow.length > 0 && releaseMessage(firstRow[0].release_date)}
            </div>
          </div>
          <div className="flex flex-wrap gap-4 w-full">
            {firstRow.map(featured => (
              <div key={featured.id} className="flex-1">
                <FeaturedGame
                  featured={featured}
                  cover={coverMap ? coverMap[featured.igdb_id] : []}
                />
              </div>
            ))}
          </div>
          {showAll && (
            <div className="w-full max-h-[400px] overflow-y-auto flex flex-wrap gap-4 my-4">
              {otherRows.map(featured => (
                <div key={featured.id} className="flex-1">
                  <FeaturedGame
                    featured={featured}
                    cover={coverMap ? coverMap[featured.igdb_id] : []}
                  />
                </div>
              ))}
            </div>
          )}
          {otherRows.length > 0 && (
            <div className="flex justify-center mt-4">
              <div className="border-primary rounded-md">
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="px-3 py-1.5"
                >
                  {showAll
                    ? "Show Less"
                    : otherRows.length === 1
                      ? "Show 1 more game"
                      : `Show ${otherRows.length} more games`
                  }
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default memo(FeaturedGames);