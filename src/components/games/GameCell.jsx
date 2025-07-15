import { useRef, useEffect, useState } from "react";
import HoverImageSlider from "./HoverImageSlider";
import { useGame } from "../../contexts/GameContext";
import he from "he";
import { highlightMatch } from "../../js/utils";
import CoverSkeleton from "../skeletons/CoverSkeleton";

function GameCell({ game, coverImage, screenshots }) {
  const tagRefs = useRef([]);
  const imgRef = useRef(null);
  const [tagLefts, setTagLefts] = useState([]);
  const [hoverBounds, setHoverBounds] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [coverLoaded, setCoverLoaded] = useState(false);
  const unmountTimeoutRef = useRef(null);
  const {
    search,
    tagsLabels,
    isReleased,
    setGameToSee,
  } = useGame();

  const activeTags = [
    {
      key: "_release",
      label: isReleased(game.release_date) ? "Released" : "Coming soon",
      color: isReleased(game.release_date) ? "bg-gradient-secondary" : "bg-gradient-tertiary",
    },
    ...Object.keys(game.tags || {})
      .filter((tag) => game.tags[tag])
      .sort((a, b) => a.localeCompare(b))
      .map((tag) => ({
        key: tag,
        label: tagsLabels[tag] || tag,
        color: "bg-gradient-primary",
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

  return (
    <td className="p-3 sticky left-0 bg-white z-20 w-80">
      <div className="relative flex items-center text-left gap-8">
        {/* Tags */}
        <div className="absolute -top-1 left-0 z-30">
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
          className="relative w-24 h-32 overflow-visible shrink-0"
        >
          {!coverLoaded && (
            <CoverSkeleton />
          )}

          {coverImage && (
            <img
              src={coverImage}
              loading="lazy"
              alt={`${game.name} cover`}
              className="absolute w-full h-full object-cover rounded shadow-md transition-opacity duration-300"
              onLoad={() => setCoverLoaded(true)}
            />
          )}
        </div>

        <button
          onClick={() => {
            setGameToSee(game)
          }}
        >
          <div className="hover:scale-105 transition text-base font-semibold text-black text-left">
            {highlightMatch(he.decode(game.name), search)}
          </div>
        </button>
      </div>

      {hoverBounds && screenshots && (
        <HoverImageSlider
          images={[...(screenshots || [])]}
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
