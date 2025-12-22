import { AiFillEdit } from "react-icons/ai";
import { FaTrash } from "react-icons/fa";
import { deleteGameFromFirestore } from "../../js/firebase";
import GameCell from "./GameCell";
import he from "he";
import { highlightMatch } from "../../js/utils";
import { motion, AnimatePresence } from "framer-motion";
import TimesDisclaimer from "./TimesDisclaimer";
import { FiInfo } from "react-icons/fi";
import { useGameUI } from "../../contexts/GameUIContext";

const getRatingStyle = (rating) => {
  const baseClasses = "size-5 px-5 py-4 rounded-xl text-white hover:cursor-default text-sm flex items-center justify-center";
  if (rating === 0) return `${baseClasses} bg-slate-300`;
  if (rating < 70) return `${baseClasses} bg-red-500`;
  if (rating >= 70 && rating < 80) return `${baseClasses} bg-amber-400`;
  if (rating >= 80 && rating < 90) return `${baseClasses} bg-green-400`;
  return `${baseClasses} bg-green-600`;
};

const GameRow = ({ ref, game, coverImage, screenshots, times, isOpen, onToggle }) => {
  const {
    search,
    getPlatformsSvg,
    edit,
    setGameToEdit,
    setIsModalOpen,
    showTimesDisclaimer,
    setShowTimesDisclaimer
  } = useGameUI();

  const timeDescriptions = {
    completely: "Finish the game to 100% completion",
    hastily: "Finish the game to its credits without spending notable time on extras such as side quests",
    normally: "Finish the game while mixing in some extras such as side quests without being overly thorough"
  };

  return (
    <>
      <tr
        ref={ref}
        id={`game-${game.id}`} className="text-center relative text-sm"
      >
        <GameCell
          game={game}
          coverImage={coverImage}
          screenshots={screenshots}
          toggleDrawer={onToggle}
        />

        <td className="p-3">
          <div className="hover:cursor-default text-sm">
            {game.release_date?.seconds
              ? new Date(game.release_date.seconds * 1000).toLocaleDateString("en-EN", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })
              : game.release_date || "Unknown"}
          </div>
        </td>

        <td className="p-3">
          <div className="flex flex-col divide-y">
            {game.developers.map((developer) => (
              <a target="_blank" rel="noreferrer" href={developer.link} key={developer.name}>
                <div className="hover:scale-105 transition text-sm py-1">
                  {highlightMatch(he.decode(developer.name), search)}
                </div>
              </a>
            ))}
          </div>
        </td>

        <td className="p-3">
          <div className="flex flex-col divide-y">
            {game.editors.map((editor) => (
              <a target="_blank" rel="noreferrer" href={editor.link} key={editor.name}>
                <div className="hover:scale-105 transition text-sm py-1">
                  {highlightMatch(he.decode(editor.name), search)}
                </div>
              </a>
            ))}
          </div>
        </td>

        <td className="p-3">
          <div className="flex flex-row gap-2 justify-center flex-wrap">
            {Object.keys(game.platforms)
              .filter((platform) => game.platforms[platform])
              .sort()
              .map((platform) => (
                <div key={platform}>{getPlatformsSvg(platform)}</div>
              ))}
            {Object.values(game.platforms).every((value) => !value) && (
              <span className="text-sm">TBA</span>
            )}
          </div>
        </td>

        <td className="p-3">
          <div className="flex flex-col gap-3">
            <div className="flex flex-row gap-2 justify-center">
              {["critics", "players"].map((ratingType, index) => (
                <div key={index} className={`${getRatingStyle(Number(game.ratings[ratingType]))}`}>
                  {Number(game.ratings[ratingType]) === 0 ? "/" : game.ratings[ratingType]}
                </div>
              ))}
            </div>
            {game.ratings.link ? (
              <a target="_blank" rel="noreferrer" href={game.ratings.link}>
                <div className="text-xs hover:scale-105 transition">
                  <span className="font-normal">Details on </span>
                  <span className="font-bold">OpenCritic</span>
                </div>
              </a>
            ) : (
              <div className="text-xs">Edit to add link</div>
            )}
          </div>
        </td>

        {edit && (
          <td className="p-3 sticky right-0 bg-sticky-column z-20">
            <div className="flex flex-row gap-3 justify-center items-center">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsModalOpen(true);
                  setGameToEdit(game);
                }}
                className="size-6 p-1 sm:text-sm sm:w-fit sm:py-2 sm:px-2.5 sm:flex flex-row items-center bg-amber-400 rounded-md"
              >
                <AiFillEdit />
              </button>
              <button
                className="size-6 p-1 sm:text-sm sm:w-fit sm:py-2 sm:px-2.5 sm:flex flex-row items-center bg-red-400 rounded-md"
                onClick={() => {
                  if (window.confirm(`Are you sure you want to delete "${game.name}" ?`)) {
                    deleteGameFromFirestore(game.id);
                  }
                }}
              >
                <FaTrash />
              </button>
            </div>
          </td>
        )}
      </tr>
      <AnimatePresence>
        {isOpen && (
          <tr>
            <td colSpan={edit ? 7 : 6} className="bg-background">
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="p-6 flex flex-row justify-between">
                  {times ? (
                    <div className="flex flex-col gap-3 w-1/2">

                      {showTimesDisclaimer ? (
                        <TimesDisclaimer onClose={() => setShowTimesDisclaimer(false)} />
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowTimesDisclaimer(true)}
                          className="self-start text-xs text-yellow-200 hover:text-yellow-100 underline"
                        >
                          Show estimated playtime disclaimer
                        </button>
                      )}
                      <div className="flex gap-4 items-center flex-wrap">
                        {Object.entries(times).map(([label, seconds]) => {
                          const hours = (seconds / 3600).toFixed(1);
                          const title = label.charAt(0).toUpperCase() + label.slice(1);
                          const colors = {
                            completely: "bg-gradient-primary",
                            hastily: "bg-gradient-tertiary",
                            normally: "bg-gradient-secondary"
                          };

                          return (
                            <div
                              key={label}
                              className={`relative group rounded-xl shadow-md p-4 text-center w-28 ${colors[label] || "bg-gray-100 text-gray-800"}`}
                            >
                              {/* Info icon in top right */}
                              <div className="absolute top-1 right-1">
                                <FiInfo className="text-white/80 group-hover:text-white" size={14} />
                              </div>

                              <div className="text-sm font-semibold">{title}</div>
                              <div className="text-xl font-bold">{hours}h</div>

                              {/* Popover on hover */}
                              <div className="absolute bottom-full mb-2 w-48 text-xs bg-white text-gray-800 border border-gray-200 rounded-md shadow-lg p-2 opacity-0 group-hover:opacity-100 pointer-events-none transition duration-200">
                                {timeDescriptions[label]}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div>No estimation playtimes reported on IGDB yet.</div>
                  )}
                </div>
              </motion.div>
            </td>
          </tr>
        )}
      </AnimatePresence>
    </>
  );
};

export default GameRow;
