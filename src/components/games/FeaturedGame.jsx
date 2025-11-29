import { useState } from "react";
import { useGame } from "../../contexts/GameContext";
import CoverSkeleton from "../skeletons/CoverSkeleton";

const FeaturedGame = ({ featured, cover }) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const {
    setFeaturedOpen,
    setSearch,
    setOpenSearch,
  } = useGame();

  return (
    <div className="flex flex-row gap-3 rounded-lg border-primary">
      <div className="relative h-full w-32" style={{ maxHeight: "180px" }}>
        {!imgLoaded && (
          <CoverSkeleton />
        )}
        {cover && (
          <img
            src={cover}
            alt={featured.name}
            className="h-full w-32 object-cover rounded-lg transition-opacity duration-300"
            style={{ maxHeight: "180px" }}
            loading="lazy"
            onLoad={() => setImgLoaded(true)}
          />
        )}
      </div>
      <div className="flex flex-col h-full justify-between gap-4 relative z-10 flex-1 py-4 px-2">
        <div className="flex flex-row items-center justify-between w-full">
          <div className="flex flex-col">
            <h2 className="text-xl font-bold">{featured.name}</h2>
            <div className="flex flex-row gap-1 text-sm flex-wrap">
              <div>By</div>
              {featured.developers.map((dev, index) => (
                <div key={`featured-${dev.name}`} className="font-semibold">
                  {dev.name}
                  {index < featured.developers.length - 2
                    ? ", "
                    : index === featured.developers.length - 2
                      ? " & "
                      : ""}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-row items-center justify-between">
          <button
            onClick={() => {
              setOpenSearch(true);
              setSearch(featured.name);
              setFeaturedOpen(featured.id);
            }}
            className="self-start bg-gradient-primary text-white text-sm px-3 py-1.5 rounded-md hover:scale-105 transition"
          >
            View Game
          </button>
        </div>
      </div>
    </div>
  );
}

export default FeaturedGame;