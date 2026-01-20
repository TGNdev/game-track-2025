import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiChevronDown } from "react-icons/fi";
import { FaExternalLinkAlt } from "react-icons/fa";
import { useGameUI } from "../../contexts/GameUIContext";
import he from "he";
import { highlightMatch, slugify } from "../../js/utils";
import { TAGS } from "../../js/config";
import CoverSkeleton from "../skeletons/CoverSkeleton";

const GameCard = ({ ref, game, forceOpen, setForceOpen, coverImage }) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [coverLoaded, setCoverLoaded] = useState(false);
  const {
    search,
    getPlatformsSvg,
    isReleased,
    opened,
    edit,
    setIsModalOpen,
    setGameToEdit
  } = useGameUI();
  const enabledTags = Object.keys(game.tags || {})
    .filter(t => game.tags && game.tags[t])
    .sort((a, b) => a.localeCompare(b));

  useEffect(() => {
    setIsOpen(opened || forceOpen);
  }, [opened, forceOpen]);

  const platforms = Object.keys(game.platforms).filter(p => game.platforms[p]);
  const tagsLabels = Object.fromEntries(
    Object.keys(TAGS).map((key) => [key, TAGS[key].label])
  );

  return (
    <div
      ref={ref}
      id={`gamecard-${game.id}`}
      className="rounded-2xl overflow-hidden transition-all duration-300 relative border border-white/10 bg-white/5 backdrop-blur-sm shadow-xl"
    >
      <div className="absolute top-0 left-0 flex flex-row justify-between w-full p-2 z-20 pointer-events-none">
        <div className="flex flex-row gap-2">
          {isReleased(game.release_date) ? (
            <div className="bg-gradient-secondary text-[10px] uppercase font-black px-2 py-0.5 rounded-full shadow-lg">
              Released
            </div>
          ) : (
            <div className="bg-gradient-tertiary text-[10px] uppercase font-black px-2 py-0.5 rounded-full shadow-lg">
              Coming soon
            </div>
          )}
        </div>
        {enabledTags.length > 0 && (
          <div className="flex gap-1">
            {enabledTags.slice(0, 2).map((tag, idx) => (
              <span
                key={idx}
                className="whitespace-nowrap text-[10px] uppercase font-black bg-gradient-primary px-2 py-0.5 rounded-full shadow-lg"
                title={tag}
              >
                {tagsLabels[tag]}
              </span>
            ))}
          </div>
        )}
      </div>

      <button
        className="w-full flex justify-between items-center px-6 pt-10 pb-4 text-left hover:scale-[1.02] active:scale-[0.98]"
        onClick={() => {
          const closing = isOpen && forceOpen;
          setIsOpen(prev => !prev);
          if (closing) {
            setTimeout(() => setForceOpen(), 0);
          }
        }}
      >
        <div className="flex flex-col gap-1">
          <span className="text-xl font-black leading-tight">
            {highlightMatch(he.decode(game.name), search)}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold opacity-80">
              {game.release_date?.seconds
                ? new Date(game.release_date.seconds * 1000).toLocaleDateString("en-EN", {
                  month: "long",
                  year: "numeric",
                })
                : game.release_date || "Unknown"}
            </span>
            <div className="flex flex-row items-center gap-1 opacity-80">
              {platforms.sort().map((platform, idx) => (
                <span key={idx} className="scale-90 origin-left">
                  {getPlatformsSvg(platform, true)}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <FiChevronDown
            className={`text-xl size-6 transition-transform duration-500 ease-out ${isOpen ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      <div
        className={`grid transition-[grid-template-rows,opacity] duration-500 ease-in-out overflow-hidden ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          }`}
      >
        <div className="min-h-0 relative z-10 border-t border-white/5">
          <div className="flex flex-col">
            <div className="flex flex-row p-4 gap-4">
              {coverImage && (
                <div className="relative flex-shrink-0 w-32 aspect-[3/4] rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-background">
                  {!coverLoaded && <CoverSkeleton />}
                  <img
                    src={coverImage}
                    alt={game.name}
                    className={`w-full h-full object-cover transition-opacity duration-300 ${coverLoaded ? "opacity-100" : "opacity-0"}`}
                    onLoad={() => setCoverLoaded(true)}
                  />
                </div>
              )}

              <div className="flex flex-col justify-between py-1 flex-1">
                <div className="space-y-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary-light">Developers</span>
                    <div className="flex flex-col gap-0.5">
                      {game.developers.map((dev, idx) => (
                        <span key={idx} className="text-sm font-bold truncate">
                          {he.decode(dev.name)}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary-light">Publishers</span>
                    <div className="flex flex-col gap-0.5">
                      {game.editors.map((edit, idx) => (
                        <span key={idx} className="text-sm font-bold truncate">
                          {he.decode(edit.name)}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-2">
                  {["critics", "players"].map((type, idx) => {
                    const rating = Number(game.ratings[type]);
                    const bgClass =
                      rating === 0 ? "bg-white/10" :
                        rating < 70 ? "bg-red-500/80" :
                          rating < 80 ? "bg-amber-400/80" :
                            rating < 90 ? "bg-green-400/80" : "bg-green-600/80";

                    return (
                      <div key={idx} className="flex flex-col items-center gap-1">
                        <div className={`size-10 flex items-center justify-center rounded-lg text-white font-black text-xs backdrop-blur-sm border border-white/10 shadow-lg ${bgClass}`}>
                          {rating === 0 ? "/" : rating}
                        </div>
                        <span className="text-[8px] font-black uppercase text-white/40 tracking-tighter">
                          {type === "critics" ? "Critics" : "Players"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex gap-2 p-4 pt-0">
              <button
                className="flex-1 bg-gradient-primary flex items-center justify-center gap-2 py-3 rounded-xl uppercase font-black text-sm transition shadow-lg"
                onClick={() => navigate(`/games/${slugify(game.name)}`)}
              >
                <FaExternalLinkAlt className="size-3" />
                View Details
              </button>
              {edit && (
                <button
                  className="bg-gradient-tertiary flex items-center justify-center p-3 rounded-xl transition"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsModalOpen(true);
                    setGameToEdit(game);
                  }}
                >
                  <span className="text-xs font-black">EDIT</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameCard;
