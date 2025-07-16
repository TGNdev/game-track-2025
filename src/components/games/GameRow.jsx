import { AiFillEdit } from "react-icons/ai";
import { FaTrash } from "react-icons/fa";
import { deleteGameFromFirestore } from "../../js/firebase";
import GameCell from "./GameCell";
import { useGame } from "../../contexts/GameContext";
import he from "he";
import { highlightMatch } from "../../js/utils";

const getRatingStyle = (rating) => {
  const baseClasses = "size-5 px-5 py-4 rounded-xl text-white hover:cursor-default text-sm flex items-center justify-center";
  if (rating === 0) return `${baseClasses} bg-slate-300`;
  if (rating < 70) return `${baseClasses} bg-red-500`;
  if (rating >= 70 && rating < 80) return `${baseClasses} bg-amber-400`;
  if (rating >= 80 && rating < 90) return `${baseClasses} bg-green-400`;
  return `${baseClasses} bg-green-600`;
};

const GameRow = ({ ref, game, coverImage, screenshots }) => {
  const {
    search,
    getPlatformsSvg,
    edit,
    setGameToEdit,
    setIsModalOpen
  } = useGame();

  return (
    <tr
      ref={ref}
      id={`game-${game.id}`} className="text-center relative text-sm"
    >
      <GameCell
        game={game}
        coverImage={coverImage}
        screenshots={screenshots}
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
              <div className="hover:scale-110 transition text-sm py-1">
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
              <div className="hover:scale-110 transition text-sm py-1">
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
              <div className="text-xs text-slate-500 hover:scale-110 transition">
                <span className="font-normal">Details on </span>
                <span className="font-bold">OpenCritic</span>
              </div>
            </a>
          ) : (
            <div className="text-xs text-slate-500">Edit to add link</div>
          )}
        </div>
      </td>

      {edit && (
        <td className="p-3 sticky right-0 bg-white z-20">
          <div className="flex flex-row gap-3 justify-center items-center">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsModalOpen(true);
                setGameToEdit(game);
              }}
              className="size-6 p-1 sm:text-sm sm:w-fit sm:py-2 sm:px-2.5 sm:flex flex-row items-center bg-amber-400 text-white rounded-md hover:scale-110 transition"
            >
              <AiFillEdit />
            </button>
            <button
              className="size-6 p-1 sm:text-sm sm:w-fit sm:py-2 sm:px-2.5 sm:flex flex-row items-center bg-red-400 text-white rounded-md hover:scale-110 transition"
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
  );
};

export default GameRow;
