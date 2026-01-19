import { Timestamp } from "firebase/firestore";
import { memo } from "react";
import FeaturedGame from "./FeaturedGame";
import { useGameData } from "../../contexts/GameDataContext";

const FeaturedGames = ({ games }) => {
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

    return (
      <div className={`${classes}`}>
        <p>{text}</p>
        <p className="italic text-xs font-normal">{formatReleaseDate(releaseDate)}</p>
      </div>
    );
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

  if (featuredGames.length === 0) return null;

  return (
    <div className="w-full rounded-xl mt-6 shadow-lg">
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-between mb-4">
          <div className="text-2xl font-bold text-center sm:text-left">
            {featuredGames.length > 1 ? "Next Releases" : "Next Release"}
          </div>
          <div className="sm:ml-auto font-semibold">
            {featuredGames.length > 0 && releaseMessage(featuredGames[0].release_date)}
          </div>
        </div>

        <div className="max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
          <div className="flex flex-wrap gap-4 w-full">
            {featuredGames.map(featured => (
              <div key={featured.id} className="min-w-[300px] md:min-w-[400px] flex-1">
                <FeaturedGame
                  featured={featured}
                  cover={coverMap ? coverMap[featured.igdb_id] : []}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(FeaturedGames);