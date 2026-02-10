import { useMemo } from "react";
import { AiFillEdit } from "react-icons/ai";
import { FaTrash } from "react-icons/fa";
import { deleteGameFromFirestore } from "../../js/firebase";
import GameCell from "./GameCell";
import he from "he";
import { highlightMatch } from "../../js/utils";
import { useGameUI } from "../../contexts/GameUIContext";

const getRatingStyle = (rating) => {
  const baseClasses = "min-w-[40px] px-3 py-2 rounded-xl text-white text-xs flex items-center justify-center font-black shadow-lg";
  if (rating === 0 || !rating) return `${baseClasses} bg-white/10 text-white/40`;
  if (rating < 70) return `${baseClasses} bg-gradient-to-br from-red-400 to-red-600`;
  if (rating >= 70 && rating < 80) return `${baseClasses} bg-gradient-to-br from-amber-300 to-amber-500`;
  if (rating >= 80 && rating < 90) return `${baseClasses} bg-gradient-to-br from-green-400 to-green-600`;
  return `${baseClasses} bg-gradient-to-br from-green-500 to-green-600`;
};

const GameRow = ({ ref, game, coverImage, screenshots }) => {
  const {
    search,
    getPlatformsSvg,
    edit,
    setGameToEdit,
    setIsModalOpen,
  } = useGameUI();

  const releaseDate = useMemo(() => {
    if (game.release_date?.seconds) {
      return new Date(game.release_date.seconds * 1000).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
    return game.release_date || "TBA";
  }, [game.release_date]);

  return (
    <tr
      ref={ref}
      id={`game-${game.id}`}
      className="group hover:bg-white/[0.02] transition-colors border-b border-white/5 last:border-0"
    >
      <GameCell
        game={game}
        coverImage={coverImage}
        screenshots={screenshots}
      />

      <td className="px-6 py-4">
        <div className="flex flex-col items-center">
          <span className="text-sm font-bold text-white/80 whitespace-nowrap">{releaseDate}</span>
        </div>
      </td>

      <td className="px-6 py-4">
        <div className="flex flex-col items-center gap-1 text-center divide-y divide-white/20">
          {game.developers.slice(0, 2).map((developer) => (
            <a
              target="_blank"
              rel="noreferrer"
              href={developer.link}
              key={developer.name}
              className="group/link text-[11px] font-bold text-white/60 hover:text-white transition-colors"
            >
              <div className="group-hover/link:translate-x-1 transition-transform">
                {highlightMatch(he.decode(developer.name), search)}
              </div>
            </a>
          ))}
          {game.developers.length > 2 && (
            <span className="text-[9px] text-white/20 font-black uppercase">+{game.developers.length - 2} more</span>
          )}
        </div>
      </td>

      <td className="px-6 py-4">
        <div className="flex flex-col items-center gap-1 text-center divide-y divide-white/20">
          {game.editors.slice(0, 2).map((editor) => (
            <a
              target="_blank"
              rel="noreferrer"
              href={editor.link}
              key={editor.name}
              className="group/link text-[11px] font-bold text-white/60 hover:text-white transition-colors"
            >
              <div className="group-hover/link:translate-x-1 transition-transform">
                {highlightMatch(he.decode(editor.name), search)}
              </div>
            </a>
          ))}
          {game.editors.length > 2 && (
            <span className="text-[9px] text-white/20 font-black uppercase">+{game.editors.length - 2} more</span>
          )}
        </div>
      </td>

      <td className="px-6 py-4">
        <div className="flex flex-row gap-2 justify-center flex-wrap">
          {Object.keys(game.platforms)
            .filter((platform) => game.platforms[platform])
            .sort()
            .map((platform) => (
              <div key={platform}>{getPlatformsSvg(platform)}</div>
            ))}
          {Object.values(game.platforms).every((value) => !value) && (
            <span className="text-[10px] font-black uppercase tracking-widest text-white/20">TBA</span>
          )}
        </div>
      </td>

      <td className="px-6 py-4">
        <div className="flex flex-col items-center gap-3">
          <div className="flex flex-row gap-2 justify-center">
            {["critics", "players"].map((ratingType) => (
              <div
                key={ratingType}
                className="flex flex-col items-center gap-1"
                title={ratingType.charAt(0).toUpperCase() + ratingType.slice(1)}
              >
                <div className={getRatingStyle(Number(game.ratings[ratingType]))}>
                  {Number(game.ratings[ratingType]) === 0 ? "/" : Math.round(game.ratings[ratingType])}
                </div>
              </div>
            ))}
          </div>
          {game.ratings.link && (
            <a
              target="_blank"
              rel="noreferrer"
              href={game.ratings.link}
              className="group/oc flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 border border-white/10 hover:bg-white/20 transition-all shadow-sm"
            >
              <span className="text-[9px] font-black uppercase tracking-tighter text-white/60 group-hover/oc:text-white/80 transition-colors">
                OpenCritic
              </span>
            </a>
          )}
        </div>
      </td>

      {edit && (
        <td className="px-6 py-4 sticky right-0 bg-sticky-column z-20">
          <div className="flex flex-row gap-2 justify-center items-center">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsModalOpen(true);
                setGameToEdit(game);
              }}
              className="p-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-amber-500/20 hover:border-amber-500/40 text-amber-500 transition-all shadow-lg group/btn"
              title="Edit Game"
            >
              <AiFillEdit className="size-4 group-hover/btn:scale-110 transition-transform" />
            </button>
            <button
              className="p-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-red-500/20 hover:border-red-500/40 text-red-500 transition-all shadow-lg group/btn"
              title="Delete Game"
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm(`Are you sure you want to delete "${game.name}" ?`)) {
                  deleteGameFromFirestore(game.id);
                }
              }}
            >
              <FaTrash className="size-4 group-hover/btn:scale-110 transition-transform" />
            </button>
          </div>
        </td>
      )}
    </tr>
  );
};

export default GameRow;
