import he from "he";
import { slugify } from "../../js/utils";
import SmartCover from "../shared/SmartCover";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useGameUI } from "../../contexts/GameUIContext";

const CompactGameCard = ({ game, coverImage }) => {
  const { getPlatformsSvg } = useGameUI();

  const releaseYear = useMemo(() => {
    if (game.release_date?.seconds) {
      return new Date(game.release_date.seconds * 1000).getFullYear();
    }
    if (typeof game.release_date === "string") {
      const yearMatch = game.release_date.match(/\b(\d{4})\b/);
      return yearMatch ? yearMatch[1] : "TBA";
    }
    return "TBA";
  }, [game.release_date]);

  const platforms = useMemo(() =>
    Object.keys(game.platforms).filter(p => game.platforms[p]).sort()
    , [game.platforms]);

  const rating = useMemo(() => {
    const critics = Number(game.ratings?.critics) || 0;
    const players = Number(game.ratings?.players) || 0;
    if (critics > 0 && players > 0) return Math.round((critics + players) / 2);
    return critics || players || 0;
  }, [game.ratings]);

  const ratingColor = useMemo(() => {
    if (rating === 0) return "bg-white/10 text-white/40";
    if (rating < 70) return "bg-red-500/80 text-white";
    if (rating < 80) return "bg-amber-400/80 text-white";
    if (rating < 90) return "bg-green-400/80 text-white";
    return "bg-green-600/80 text-white";
  }, [rating]);

  return (
    <Link
      to={`/games/${slugify(game.name)}`}
      className="group relative block aspect-[3/4] rounded-2xl overflow-hidden bg-white/5 border border-white/10 hover:border-white/20 transition-all duration-500 shadow-xl"
    >
      {/* Background Cover */}
      <div className="absolute inset-0 z-0">
        <SmartCover
          src={coverImage}
          alt={game.name}
          className="w-full h-full transform group-hover:scale-110 transition-transform duration-700"
          showSkeleton={true}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent" />
      </div>

      {/* Content */}
      <div className="absolute inset-0 z-10 p-4 flex flex-col justify-end">
        <div className="flex flex-col gap-1 translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
          <div className="flex justify-between items-end gap-2">
            <h3 className="text-lg font-black leading-tight truncate">
              {he.decode(game.name)}
            </h3>
            <span className="text-[10px] font-black opacity-40 shrink-0 mb-1 uppercase tracking-widest text-right">
              {releaseYear}
            </span>
          </div>

          <div className="flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
            <div className="flex items-center gap-1">
              {platforms.slice(0, 3).map((p) => (
                <div key={p} className="scale-75 origin-left opacity-60">
                  {getPlatformsSvg(p, true)}
                </div>
              ))}
              {platforms.length > 3 && (
                <span className="text-[8px] font-black opacity-30">+{platforms.length - 3}</span>
              )}
            </div>

            <div className={`px-2 py-0.5 rounded-md text-[10px] font-black border border-white/10 shadow-lg ${ratingColor}`}>
              {rating === 0 ? "N/A" : rating}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default CompactGameCard;
