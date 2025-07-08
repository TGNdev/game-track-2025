import { useState } from "react";
import { useGame } from "../../contexts/GameContext";

const FeaturedGame = ({ featured, cover }) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const {
    setFeaturedOpen,
  } = useGame();


  return (
    <div className="flex flex-row gap-3 bg-white rounded-lg border shadow-lg">
      <div className="relative h-full w-32" style={{ maxHeight: "180px" }}>
        {cover && (
          <>
            {!imgLoaded && (
              <div className="absolute w-full h-full bg-gray-200 rounded animate-pulse" />
            )}
            <img
              src={cover}
              alt={featured.name}
              className={`h-full w-32 object-cover rounded-lg transition-opacity duration-300 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
              style={{ maxHeight: "180px" }}
              loading="lazy"
              onLoad={() => setImgLoaded(true)}
            />
          </>
        )}
      </div>
      <div className="flex flex-col h-full justify-between gap-4 relative z-10 flex-1 py-5 px-2">
        <div className="flex flex-row items-center justify-between w-full">
          <div className="flex flex-col">
            <h2 className="text-lg font-bold">{featured.name}</h2>
            <div className="flex flex-row gap-1 text-sm text-slate-500 flex-wrap">
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
              const element = document.getElementById(`game-${featured.id}`);
              if (element) {
                element.scrollIntoView({ behavior: "smooth", block: "center" });
                setFeaturedOpen(featured.id);
              }
            }}
            className="self-start bg-blue-500 text-white text-sm px-3 py-1.5 rounded-md hover:scale-105 transition hidden sm:block"
          >
            View Game
          </button>
          <button
            onClick={() => {
              const element = document.getElementById(`gamecard-${featured.id}`);
              if (element) {
                element.scrollIntoView({ behavior: "smooth", block: "center" });
                setFeaturedOpen(featured.id);
              }
            }}
            className="self-start bg-blue-500 text-white text-sm px-3 py-1.5 rounded-md hover:scale-105 transition block sm:hidden"
          >
            View Game
          </button>
        </div>
      </div>
    </div>
  );
}

export default FeaturedGame;