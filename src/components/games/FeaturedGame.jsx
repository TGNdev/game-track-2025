import CoverSkeleton from "../skeletons/CoverSkeleton";
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { slugify } from "../../js/utils";
import { useGameData } from "../../contexts/GameDataContext";

const FeaturedGame = ({ featured, cover }) => {
  const navigate = useNavigate();
  const { companies } = useGameData();
  const [coverLoaded, setCoverLoaded] = useState(false);

  useEffect(() => {
    setCoverLoaded(false);
  }, [cover]);

  const resolvedDevelopers = useMemo(() => {
    if (featured.developerRefs && featured.developerRefs.length > 0) {
      return featured.developerRefs.map(ref => {
        const refId = typeof ref === 'object' ? ref.devId : ref;
        const found = companies.find(d => d.id === refId || d.slug === refId);
        return found ? { name: found.name, link: `/companies/${found.slug || found.id}`, refId: found.id } : null;
      }).filter(Boolean);
    }
    return featured.developers || [];
  }, [featured.developerRefs, featured.developers, companies]);

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 shadow-2xl relative overflow-hidden flex flex-row gap-3">
      <div className="relative w-32 aspect-[3/4] shrink-0 rounded-lg overflow-hidden bg-background">
        {!coverLoaded && <CoverSkeleton />}
        {cover && (
          <img
            ref={(el) => {
              if (el && el.complete) {
                setCoverLoaded(true);
              }
            }}
            src={cover}
            alt={featured.name}
            className={`w-full h-full object-cover transition-opacity duration-300 ${coverLoaded ? "opacity-100" : "opacity-0"}`}
            loading="lazy"
            onLoad={() => setCoverLoaded(true)}
          />
        )}
      </div>
      <div className="flex flex-col h-full justify-between gap-4 relative z-10 flex-1 py-4 px-2">
        <div className="flex flex-row items-center justify-between w-full">
          <div className="flex flex-col">
            <h2 className="text-xl font-bold">{featured.name}</h2>
            <div className="flex flex-row gap-1 text-sm flex-wrap">
              <div>By</div>
              {resolvedDevelopers.map((dev, index) => (
                <div 
                  key={`featured-${dev.name}`} 
                  className="font-semibold hover:text-primary cursor-pointer transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(dev.link);
                  }}
                >
                  {dev.name}
                  {index < resolvedDevelopers.length - 2
                    ? ", "
                    : index === resolvedDevelopers.length - 2
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
              navigate(`/games/${featured.slug || slugify(featured.name)}`);
            }}
            className="self-start bg-gradient-primary text-sm px-3 py-1.5 rounded-md"
          >
            View Game
          </button>
        </div>
      </div>
    </div>
  );
}

export default FeaturedGame;