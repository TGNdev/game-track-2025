import { useRef, useState, useMemo, useLayoutEffect } from "react";
import { useNavigate } from "react-router";
import { useGameUI } from "../../contexts/GameUIContext";
import he from "he";
import { highlightMatch, slugify } from "../../js/utils";
import SmartCover from "../shared/SmartCover";
import GameTag from "./GameTag";

function GameCell({ game, coverImage }) {
  const navigate = useNavigate();
  const tagRefs = useRef([]);
  const [tagLefts, setTagLefts] = useState([]);
  const { search, activeTags } = useGameUI();
  const gameTags = useMemo(() => activeTags(game), [activeTags, game]);

  useLayoutEffect(() => {
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
  };

  return (
    <td className="px-4 py-3 sticky left-0 z-20 w-96 group/cell cursor-pointer" onClick={handleGameNavigate}>
      <div className="relative flex items-center text-left gap-6">
        <div className="absolute -top-3 left-0 z-30 flex gap-1">
          {gameTags.map((tag, index) => (
            <GameTag
              key={tag.key}
              tag={tag}
              variant="rotated"
              ref={(el) => (tagRefs.current[index] = el)}
              style={{
                left: `${tagLefts[index] || 0}px`,
              }}
            />
          ))}
        </div>
          <SmartCover
            src={coverImage}
            alt={game.name}
            className="w-36 aspect-[3/4] bg-background rounded-lg shadow-2xl ring-1 ring-white/10"
          />
        <div className="flex flex-col w-full">
          <h3 className="text-base font-black leading-tight tracking-tight group-hover/cell:scale-105 transition-transform text-ellipsis">
            {highlightMatch(he.decode(game.name), search)}
          </h3>
        </div>
      </div>
    </td>
  );
}

export default GameCell;