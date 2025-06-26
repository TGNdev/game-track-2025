import { useRef, useEffect, useState } from "react";
import HoverImageSlider from "./HoverImageSlider";
import { useGame } from "./contexts/GameContext";
import he from "he";

function GameCell({ game }) {
  const tagRefs = useRef([]);
  const imgRef = useRef(null);
  const [tagLefts, setTagLefts] = useState([]);
  const [hoverBounds, setHoverBounds] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const unmountTimeoutRef = useRef(null);
  const {
    search,
    highlightMatch,
  } = useGame();

  const isReleased = () => {
    const today = new Date();
    const releaseDate = new Date(game.release_date.seconds * 1000);
    return releaseDate < today;
  };

  const tagsLabels = {
    dlc: "DLC / Expansion",
    remake: "Remake",
    remaster: "Remaster",
    port: "Port / Re-release",
  };

  const activeTags = [
    {
      key: "_release",
      label: isReleased() ? "Released" : "Coming soon",
      color: isReleased() ? "bg-green-500" : "bg-amber-400",
    },
    ...Object.keys(game.tags || {})
      .filter((tag) => game.tags[tag])
      .sort((a, b) => a.localeCompare(b))
      .map((tag) => ({
        key: tag,
        label: tagsLabels[tag] || tag,
        color: "bg-blue-500",
      })),
  ];

  useEffect(() => {
    const lefts = [];
    let currentLeft = 0;

    tagRefs.current.forEach((el) => {
      if (el) {
        lefts.push(currentLeft);
        currentLeft += el.offsetWidth + 10;
      }
    });

    setTagLefts(lefts);
  }, [game.tags, game.release_date]);

  const handleMouseEnter = () => {
    clearTimeout(unmountTimeoutRef.current);
    const rect = imgRef.current.getBoundingClientRect();
    setHoverBounds({ top: rect.top, left: rect.left });
    requestAnimationFrame(() => setIsVisible(true));
  };

  useEffect(() => {
    if (!hoverBounds) return;

    const handleScroll = () => {
      setIsVisible(false);
      clearTimeout(unmountTimeoutRef.current);
      unmountTimeoutRef.current = setTimeout(() => {
        setHoverBounds(null);
      }, 200);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [hoverBounds]);

  return (
    <td className="p-3 sticky left-0 bg-white z-20 w-80">
      <div className="relative flex items-center text-left gap-8">
        {/* Tags */}
        <div className="absolute -top-4 left-0 z-30">
          {activeTags.map((tag, index) => (
            <div
              key={tag.key}
              ref={(el) => (tagRefs.current[index] = el)}
              className={`absolute ${tag.color} text-white whitespace-nowrap text-xs font-bold px-2 py-1 rounded transform -rotate-12 shadow-lg`}
              style={{
                left: `${tagLefts[index] || 0}px`,
                transformOrigin: "left top",
              }}
            >
              {tag.label}
            </div>
          ))}
        </div>

        {/* Image + Hover logic */}
        <div
          ref={imgRef}
          onMouseEnter={handleMouseEnter}
          className="relative w-20 h-14 overflow-visible shrink-0"
        >
          {game.cover ? (
            <img
              src={game.cover}
              loading="lazy"
              alt={`${game.name} cover`}
              className="absolute w-full h-full object-cover rounded shadow-md"
            />
          ) : (
            <div className="absolute w-full h-full bg-gray-300 rounded shadow-md flex items-center justify-center">
              <span className="text-xs text-gray-500 text-center">No image ... Admin ?!</span>
            </div>
          )}
        </div>

        <a target="_blank" rel="noreferrer" href={game.link}>
          <div className="hover:scale-105 transition text-base font-semibold text-black">
            {highlightMatch(he.decode(game.name), search)}
          </div>
        </a>
      </div>

      {hoverBounds && game.cover && (
        <HoverImageSlider
          images={[game.cover, ...(game.images || [])]}
          bounds={hoverBounds}
          isVisible={isVisible}
          onClose={() => {
            setIsVisible(false);
          }}
        />
      )}
    </td>
  );
}

export default GameCell;
