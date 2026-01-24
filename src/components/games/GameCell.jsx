import { useRef, useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { useGameUI } from "../../contexts/GameUIContext";
import he from "he";
import { highlightMatch } from "../../js/utils";
import CoverSkeleton from "../skeletons/CoverSkeleton";
import { slugify } from "../../js/utils";

function GameCell({ game, coverImage }) {
  const navigate = useNavigate();
  const tagRefs = useRef([]);
  const imgRef = useRef(null);
  const [tagLefts, setTagLefts] = useState([]);
  const [coverLoaded, setCoverLoaded] = useState(false);
  const { search, activeTags } = useGameUI();
  const gameTags = useMemo(() => activeTags(game), [activeTags, game]);

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
  }, [gameTags]);

  const handleGameNavigate = (e) => {
    e.stopPropagation();
    sessionStorage.setItem("lastClickedId", game.id);
    var gameId = slugify(game.name);
    navigate(`/games/${gameId}`);
  }

  return (
    <td className="p-3 sticky left-0 bg-sticky-column z-20 w-80">
      <div className="relative flex items-center text-left gap-3 border-r">
        <div className="absolute -top-1 left-0 z-30">
          {gameTags.map((tag, index) => (
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
          className="relative w-24 aspect-[3/4] overflow-visible shrink-0"
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

        <button onClick={handleGameNavigate}>
          <div className="text-base text-left px-2">
            {highlightMatch(he.decode(game.name), search)}
          </div>
        </button>
      </div>
    </td>
  );
}

export default GameCell;