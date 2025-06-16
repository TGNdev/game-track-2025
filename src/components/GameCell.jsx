import { useRef, useEffect, useState } from "react";

function GameCell({ game }) {
  const tagRefs = useRef([]);
  const [tagLefts, setTagLefts] = useState([]);

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

  return (
    <td className="p-3 sticky left-0 bg-white z-20">
      <div className="w-fit">
        {activeTags.map((tag, index) => (
          <div
            key={tag.key}
            ref={(el) => (tagRefs.current[index] = el)}
            className={`absolute top-0 z-30 ${tag.color} text-white whitespace-nowrap text-xs font-bold px-2 py-1 rounded transform -rotate-12 shadow-lg`}
            style={{
              left: `${tagLefts[index] || 0}px`,
              transformOrigin: "left top",
            }}
          >
            {tag.label}
          </div>
        ))}
      </div>

      {/* Game name with link */}
      <a target="_blank" rel="noreferrer" href={game.link}>
        <div className="hover:scale-110 transition text-base">{game.name}</div>
      </a>
    </td>
  );
}

export default GameCell;
