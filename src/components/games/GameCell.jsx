import { useRef, useEffect, useState } from "react";
import GameImageSlider from "./GameImageSlider";
import { useGame } from "../../contexts/GameContext";
import he from "he";
import { highlightMatch } from "../../js/utils";
import CoverSkeleton from "../skeletons/CoverSkeleton";
import { TAGS } from "../../js/config";

function GameCell({ game, coverImage, screenshots, toggleDrawer }) {
  const tagRefs = useRef([]);
  const imgRef = useRef(null);
  const [tagLefts, setTagLefts] = useState([]);
  const [coverLoaded, setCoverLoaded] = useState(false);
  const [isSliderOpen, setIsSliderOpen] = useState(false);
  const [imageBounds, setImageBounds] = useState(null);

  const { search, isReleased, hasWonAward } = useGame();

  const tagsLabels = Object.fromEntries(
    Object.keys(TAGS).map((key) => [key, TAGS[key].label])
  );

  const activeTags = [
    {
      key: "_release",
      label: isReleased(game.release_date) ? "Released" : "Coming soon",
      color: isReleased(game.release_date)
        ? "bg-gradient-secondary"
        : "bg-gradient-tertiary",
    },
    ...(hasWonAward(game.id)
      ? [
        {
          key: "_award",
          label: "Game Award Winner",
          color: "bg-gradient-tertiary",
        },
      ]
      : []),
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

  const handleImageClick = (e) => {
    e.stopPropagation();
    const rect = imgRef.current?.getBoundingClientRect();
    if (rect) {
      setImageBounds({
        top: rect.top,
        left: rect.left,
        right: rect.right,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height,
      });
    }
    setIsSliderOpen(true);
  };

  return (
    <td className="p-3 sticky left-0 bg-sticky-column z-20 w-80">
      <div className="relative flex items-center text-left gap-8 border-r-2">
        <div className="absolute -top-1 left-0 z-30">
          {activeTags.map((tag, index) => (
            <div
              key={tag.key}
              ref={(el) => (tagRefs.current[index] = el)}
              className={`absolute ${tag.color} whitespace-nowrap text-xs font-bold px-2 py-1 rounded transform -rotate-12 shadow-lg`}
              style={{
                left: `${tagLefts[index] || 0}px`,
                transformOrigin: "left top",
              }}
            >
              {tag.label}
            </div>
          ))}
        </div>

        <div
          ref={imgRef}
          onClick={handleImageClick}
          className="relative w-24 aspect-[3/4] overflow-visible shrink-0 cursor-pointer transform transition-transform duration-300 ease-out hover:scale-105 hover:brightness-110"
        >
          {!coverLoaded && <CoverSkeleton />}
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

        <button onClick={toggleDrawer}>
          <div className="text-base text-left">
            {highlightMatch(he.decode(game.name), search)}
          </div>
        </button>
      </div>

      {screenshots && (
        <GameImageSlider
          images={screenshots}
          bounds={imageBounds}
          isOpen={isSliderOpen}
          onClose={() => setIsSliderOpen(false)}
        />
      )}
    </td>
  );
}

export default GameCell;