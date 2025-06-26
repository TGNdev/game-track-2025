import React, { useEffect, useState } from "react";
import { ReactComponent as XboxIcon } from "../../assets/icons/xbox.svg";
import { ReactComponent as PsIcon } from "../../assets/icons/ps.svg";
import { ReactComponent as PcIcon } from "../../assets/icons/pc.svg";
import { ReactComponent as SwitchIcon } from "../../assets/icons/switch.svg";
import { ReactComponent as Switch2Icon } from "../../assets/icons/switch_2.svg";
import { FiChevronDown } from "react-icons/fi";
import { FaThumbsUp } from "react-icons/fa6";
import { useGame } from "../../contexts/GameContext";
import he from "he";

const getPlatformsSvg = (platform) => {
  const base = `size-5 p-1`;
  switch (platform) {
    case "xbox":
      return <XboxIcon className={`${base} bg-green-500`} fill="white" />;
    case "ps":
      return <PsIcon className={`${base} bg-blue-500`} fill="white" />;
    case "pc":
      return <PcIcon className={`${base} bg-slate-400`} fill="white" />;
    case "switch":
      return <SwitchIcon className={`${base} bg-red-500`} fill="white" />;
    case "switch_2":
      return <Switch2Icon className={`${base} bg-red-500`} fill="white" />;
    default:
      return null;
  }
};

const GameCard = ({ game, edit, opened, forceOpen, setForceOpen, setIsModalOpen, setGameToEdit }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const {
    search,
    highlightMatch,
  } = useGame();
  const tagsLabels = {
    dlc: "DLC / Expansion",
    remake: "Remake",
    remaster: "Remaster",
    port: "Port / Re-release",
  };
  const enabledTags = Object.keys(game.tags || {})
    .filter(t => game.tags && game.tags[t])
    .sort((a, b) => a.localeCompare(b));
  const images = game.cover ? [game.cover, ...(game.images || [])] : (game.images || []);

  useEffect(() => {
    setIsOpen(opened || forceOpen);
  }, [opened, forceOpen]);

  useEffect(() => {
    if (!isOpen) {
      setCurrentImageIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [isOpen, images.length]);

  const isReleased = () => {
    const today = new Date();
    const releaseDate = new Date(game.release_date.seconds * 1000);
    return releaseDate < today;
  };

  const platforms = Object.keys(game.platforms).filter(p => game.platforms[p]);

  return (
    <div
      id={`gamecard-${game.id}`}
      className={`${forceOpen ? "" : ""} bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 relative`}
    >
      <button
        className="w-full flex justify-between items-center px-7 pt-7 pb-3 text-left bg-slate-100 hover:bg-slate-200 transition"
        onClick={() => {
          const closing = isOpen && forceOpen;
          setIsOpen(prev => !prev);
          if (closing) {
            setTimeout(() => setForceOpen(), 0);
          }
        }}
      >
        <div className="flex flex-col gap-1">
          <span className="text-lg font-bold">
            {highlightMatch(he.decode(game.name), search)}
          </span>
          <span className="text-xs">
            {game.release_date?.seconds
              ? new Date(game.release_date.seconds * 1000).toLocaleDateString("en-EN", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })
              : game.release_date || "Unknown"}
          </span>
        </div>
        <FiChevronDown
          className={`text-xl absolute right-4 top-8 size-6 transform transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      <div className="absolute top-0 left-0 flex flex-row justify-between w-full">
        <div className="flex flex-row">
          {/* Released badge */}
          {isReleased() ? (
            <div className="bg-green-500 text-white text-xs font-bold px-1.5 py-0.5 z-20">
              Released
            </div>
          ) : (
            <div className="bg-amber-400 text-white text-xs font-bold px-1.5 py-0.5 z-20">
              Coming soon
            </div>
          )}
          <div className="flex flex-row items-center h-5">
            {platforms.sort().map((platform, idx) => (
              <span key={idx}>
                {getPlatformsSvg(platform)}
              </span>
            ))}
          </div>
        </div>
        {enabledTags.length > 0 && (
          <div className="flex items-center justify-center divide-x-2">
            {enabledTags.map((tag, idx) => (
              <span
                key={idx}
                className="whitespace-nowrap text-xs bg-blue-500 text-white px-1.5 py-0.5 font-semibold"
                title={tag}
              >
                {tagsLabels[tag]}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Content drawer */}
      <div
        className={`grid transition-all duration-500 ease-in-out overflow-hidden border-x ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          }`}
        style={{
        backgroundImage: images.length > 0 ? `url(${images[currentImageIndex]})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          position: "relative",
          zIndex: 0,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(255,255,255,0.65)",
            zIndex: 1,
            borderRadius: "inherit",
          }}
        />
        <div className="min-h-0 relative z-10">
          <div className="p-4 flex flex-row gap-6 relative">
            <div className="flex flex-1 flex-col gap-6">
              {/* Developers */}
              <div className="flex flex-col gap-1 w-fit text-sm pt-2">
                <div className="font-semibold">Developers :</div>
                {game.developers.map((dev, idx) => (
                  <a target="_blank" rel="noreferrer" href={dev.link} key={idx} className="hover:scale-110 transition">{dev.name}</a>
                ))}
              </div>


              {/* Editors */}
              <div className="flex flex-col gap-1 w-fit text-sm pt-2">
                <div className="font-semibold">Editors :</div>
                {game.editors.map((edit, idx) => (
                  <a target="_blank" rel="noreferrer" href={edit.link} key={idx} className="hover:scale-110 transition">{edit.name}</a>
                ))}
              </div>

              {edit && (
                <button
                  className="bg-amber-400 text-white rounded-md w-fit text-sm px-2 py-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsModalOpen(true);
                    setGameToEdit(game)
                  }}
                >
                  Edit game
                </button>
              )}
            </div>

            {/* Ratings */}
            <div className="max-w-fit flex flex-col items-center justify-center gap-3">
              {["critics", "players"].map((type, idx) => {
                const rating = game.ratings[type];
                const bgClass = rating == 0 ? "bg-gray-300" :
                  rating < 70 ? "bg-red-500" :
                    rating < 80 ? "bg-amber-400" :
                      rating < 90 ? "bg-green-400" : "bg-green-600";
                const ringClass = rating == 0 ? "bg-gray-400" :
                  rating < 70 ? "bg-red-600" :
                    rating < 80 ? "bg-amber-500" :
                      rating < 90 ? "bg-green-500" : "bg-green-700";

                return (
                  <div key={idx} className={`rounded-full p-1 ${ringClass}`}>
                    <div className={`size-14 flex items-center justify-center rounded-full text-white font-bold text-base relative ${bgClass}`}>
                      {game.ratings[type] >= 80 && (
                        <div className="absolute -top-2 -right-1 -rotate-6 text-amber-400 text-xl">
                          <FaThumbsUp />
                        </div>
                      )}
                      {rating == 0 ? "/" : rating}
                    </div>
                  </div>
                );
              })}
              {game.ratings.link ? (
                <a target="_blank" rel="noreferrer" href={game.ratings.link} className="text-center">
                  <div className="text-xs hover:scale-110 transition"><span className="font-normal">Details on</span> <span className="font-bold">OpenCritic</span></div>
                </a>
              ) : (
                <div className="text-center text-xs">Edit to add link</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameCard;
