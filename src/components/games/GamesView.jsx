import GameRow from "./GameRow";
import GameCard from "./GameCard";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Timestamp } from "firebase/firestore";
import { FaFilter } from "react-icons/fa";
import FeaturedGames from "./FeaturedGames";
import { matchesSearch } from "../../js/utils";
import FilterButton from "../shared/FilterButton";
import Pagination from "../shared/Pagination";
import { PLATFORMS } from "../../js/config";
import { useGameData } from "../../contexts/GameDataContext";
import { useGameUI } from "../../contexts/GameUIContext";
import { FaUser } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import ScrollableContainer from "../shared/ScrollableContainer";

const GamesView = () => {
  const {
    search,
    edit,
    isModalOpen,
    featuredOpen,
    setFeaturedOpen,
    itemsPerPage,
    currentPage,
    setCurrentPage,
    setItemsPerPage,
    isMobile,
    selectedPlatforms,
    showOnlyUpcoming,
    selectedYear,
    withRelease,
    setWithRelease,
    filtersVisible,
    setFiltersVisible,
    setSelectedPlatforms,
    setShowOnlyUpcoming,
    setSelectedYear,
  } = useGameUI();
  const {
    games,
    coverMap,
    screenshotsMap,
    loadingGames,
    users
  } = useGameData();
  const navigate = useNavigate();
  const isFirstRender = useRef(true);
  const isInitialFilterMount = useRef(true);
  const firstItemRef = useRef(null);





  const getPlatformArray = (platformsObj) => {
    if (Array.isArray(platformsObj)) return platformsObj;
    if (typeof platformsObj === 'object' && platformsObj !== null) {
      return Object.entries(platformsObj)
        .filter(([_, enabled]) => enabled)
        .map(([key]) => key.toUpperCase());
    }
    return [];
  };

  const allPlatforms = Array.from(
    new Set(games.flatMap(game => getPlatformArray(game.platforms)))
  ).sort();

  const platformLabels = Object.keys(PLATFORMS).reduce((acc, key) => {
    acc[key.toLowerCase()] = PLATFORMS[key].label;
    return acc;
  }, {});

  const allYears = useMemo(() => {
    const years = games.map(game => {
      if (game.release_date instanceof Timestamp) {
        return new Date(game.release_date.seconds * 1000).getFullYear();
      }
      if (typeof game.release_date === "string") {
        const yearMatch = game.release_date.match(/\b(\d{4})\b/);
        return yearMatch ? parseInt(yearMatch[1]) : null;
      }
      return null;
    }).filter(year => year !== null);
    return Array.from(new Set(years)).sort((a, b) => b - a);
  }, [games]);

  const filtered = useMemo(() => {
    const quarterWeight = { Q1: 1, Q2: 2, Q3: 3, Q4: 4 };

    const getSortValue = (release_date) => {
      if (release_date instanceof Timestamp) {
        return new Date(release_date.seconds * 1000).getTime();
      }
      if (typeof release_date === "string") {
        const quarterMatch = release_date.match(/Q([1-4]) (\d{4})/);
        const tbaMatch = release_date.match(/TBA (\d{4})/);

        if (quarterMatch) {
          const [, q, year] = quarterMatch;
          return parseInt(year) * 100 + quarterWeight[`Q${q}`];
        }
        if (tbaMatch) {
          const [, year] = tbaMatch;
          return parseInt(year) * 100 + 99;
        }
        if (release_date === "TBA") return Infinity;
      }
      return Infinity;
    };

    const getPlatformArray = (platformsObj) => {
      if (Array.isArray(platformsObj)) return platformsObj;
      if (typeof platformsObj === "object" && platformsObj !== null) {
        return Object.entries(platformsObj)
          .filter(([_, enabled]) => enabled)
          .map(([key]) => key.toUpperCase());
      }
      return [];
    };

    const now = new Date();

    return games
      .filter((game) => {
        if (withRelease) return game.release_date instanceof Timestamp;
        return typeof game.release_date === "string";
      })
      .filter((game) => {
        const matchesSearchValue =
          matchesSearch(game.name, search) ||
          game.developers.some((dev) => matchesSearch(dev.name, search)) ||
          game.editors.some((editor) => matchesSearch(editor.name, search));

        const matchesPlatform =
          selectedPlatforms.length === 0 ||
          selectedPlatforms.every((platform) =>
            getPlatformArray(game.platforms).includes(platform)
          );

        const isTimestamp = game.release_date instanceof Timestamp;

        let matchesReleaseStatus = true;
        if (isTimestamp && showOnlyUpcoming !== null) {
          const release = new Date(game.release_date.seconds * 1000);
          matchesReleaseStatus = showOnlyUpcoming ? release >= now : release < now;
        }

        let matchesYear = true;
        if (selectedYear) {
          if (isTimestamp) {
            const release = new Date(game.release_date.seconds * 1000);
            matchesYear = release.getFullYear() === selectedYear;
          } else if (typeof game.release_date === "string") {
            const yearMatch = game.release_date.match(/\b(\d{4})\b/);
            matchesYear = yearMatch ? parseInt(yearMatch[1]) === selectedYear : false;
          } else {
            matchesYear = false;
          }
        }

        return matchesSearchValue && matchesPlatform && matchesReleaseStatus && matchesYear;
      })
      .sort((a, b) => {
        const aSort = getSortValue(a.release_date);
        const bSort = getSortValue(b.release_date);
        if (aSort !== bSort) return aSort - bSort;
        return a.name.localeCompare(b.name);
      });
  }, [games, search, selectedPlatforms, showOnlyUpcoming, withRelease, selectedYear]);

  const filteredUsers = useMemo(() => {
    if (!search || search.length < 2) return [];
    return users.filter(user => matchesSearch(user.username, search));
  }, [users, search]);

  useEffect(() => {
    if (!loadingGames && filtered.length > 0) {
      const lastClickedId = sessionStorage.getItem("lastClickedId");
      if (lastClickedId) {
        const timer = setTimeout(() => {
          const element = document.getElementById(`game-${lastClickedId}`) ||
            document.getElementById(`gamecard-${lastClickedId}`);
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
            sessionStorage.removeItem("lastClickedId");
          }
        }, 100);
        return () => clearTimeout(timer);
      }
    }
  }, [loadingGames, filtered.length]);

  useLayoutEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    }
  }, [isModalOpen]);

  useLayoutEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const lastClickedId = sessionStorage.getItem("lastClickedId");
    if (firstItemRef.current && !lastClickedId) {
      const headerHeight = 325;
      const top = firstItemRef.current.getBoundingClientRect().top + window.scrollY - headerHeight;

      window.scrollTo({ top, behavior: 'smooth', });
    }
  }, [currentPage]);

  useEffect(() => {
    if (isInitialFilterMount.current) {
      isInitialFilterMount.current = false;
      return;
    }
    setCurrentPage(1);
  }, [search, selectedPlatforms, showOnlyUpcoming, withRelease, selectedYear, itemsPerPage, setCurrentPage]);

  return (
    <div className="px-6 w-full flex flex-col gap-6 pb-4">
      <FeaturedGames games={games} />

      {search && filteredUsers.length > 0 && (
        <section className="w-full flex flex-col gap-4">
          <div className="flex items-center gap-2 text-white/60 px-2 font-bold uppercase tracking-wider text-xs">
            <FaUser className="size-3" />
            <span>Matching Users ({filteredUsers.length})</span>
          </div>
          <ScrollableContainer>
            {filteredUsers.map(user => (
              <div
                key={user.id}
                onClick={() => navigate(`/profiles/${user.username}`)}
                className="hover:cursor-pointer shrink-0 flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 p-3 rounded-2xl transition-colors duration-200 shadow-lg"
              >
                <div className="p-3 rounded-xl bg-gradient-primary">
                  <FaUser className="size-5" />
                </div>
                <div className="flex flex-col items-start pr-4">
                  <span className="font-black text-sm">{user.username}</span>
                  <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest">
                    {(user.library?.played?.length || 0) + (user.library?.toPlay?.length || 0)} Games
                  </span>
                </div>
              </div>
            ))}
          </ScrollableContainer>
          <div className="border-b border-white/10 w-full mt-2" />
        </section>
      )}

      <div className="w-full flex justify-center mt-4">
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-1.5 shadow-2xl flex items-center gap-1">
          <button
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${withRelease
              ? "bg-gradient-primary text-white shadow-lg shadow-[#b069ff]/20"
              : "text-white/40 hover:text-white hover:bg-white/5"
              }`}
            onClick={() => setWithRelease(true)}
            disabled={withRelease}
          >
            With release date
          </button>
          <button
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${!withRelease
              ? "bg-gradient-primary text-white shadow-lg shadow-[#b069ff]/20"
              : "text-white/40 hover:text-white hover:bg-white/5"
              }`}
            onClick={() => setWithRelease(false)}
            disabled={!withRelease}
          >
            Without release date
          </button>
        </div>
      </div>

      <div className="w-full flex flex-col items-center">
        <button
          className="flex items-center text-[10px] font-black uppercase tracking-[0.2em] gap-3 px-6 py-3 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 hover:border-white/20 transition-all shadow-xl backdrop-blur-sm group"
          onClick={() => setFiltersVisible(prev => !prev)}
        >
          <FaFilter className={`size-3 transition-colors ${filtersVisible ? 'text-[#b069ff]' : 'text-white/40 group-hover:text-white'}`} />
          <span>{filtersVisible ? "Hide Filters" : "Show Filters"}</span>
        </button>
        <AnimatePresence>
          {filtersVisible && (
            <motion.div
              initial={{ height: 0, opacity: 0, marginTop: 0 }}
              animate={{ height: "auto", opacity: 1, marginTop: 16 }}
              exit={{ height: 0, opacity: 0, marginTop: 0 }}
              transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
              className="overflow-hidden w-full"
            >
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
                <div className="flex flex-col gap-8 items-center">
                  {withRelease && (
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xs font-bold uppercase tracking-wider opacity-50">Release Year</span>
                      <div className="flex flex-wrap justify-center gap-2">
                        {allYears.map(year => (
                          <FilterButton
                            key={year}
                            isVisible={filtersVisible}
                            filterCondition={selectedYear === year}
                            onClick={() => setSelectedYear(prev => prev === year ? null : year)}
                            text={year.toString()}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xs font-bold uppercase tracking-wider opacity-50">Platforms</span>
                    <div className="flex flex-wrap justify-center gap-2">
                      {allPlatforms.map(platform => (
                        <FilterButton
                          key={platform}
                          isVisible={filtersVisible}
                          filterCondition={selectedPlatforms.includes(platform)}
                          onClick={() => {
                            setSelectedPlatforms(prev =>
                              prev.includes(platform)
                                ? prev.filter(p => p !== platform)
                                : [...prev, platform]
                            );
                          }}
                          text={platformLabels[platform.toLowerCase()] || platform}
                        />
                      ))}
                    </div>
                  </div>
                  {withRelease && (
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xs font-bold uppercase tracking-wider opacity-50">Release Status</span>
                      <div className="flex flex-wrap justify-center gap-2">
                        <FilterButton
                          isVisible={filtersVisible}
                          filterCondition={showOnlyUpcoming === true}
                          onClick={() => setShowOnlyUpcoming(showOnlyUpcoming === true ? null : true)}
                          text="Upcoming only"
                        />
                        <FilterButton
                          isVisible={filtersVisible}
                          filterCondition={showOnlyUpcoming === false}
                          onClick={() => setShowOnlyUpcoming(showOnlyUpcoming === false ? null : false)}
                          text="Already released"
                        />
                      </div>
                    </div>
                  )}
                  <div className="pt-4 border-t border-white/10 w-full flex justify-center">
                    <button
                      onClick={() => {
                        setSelectedPlatforms([]);
                        setShowOnlyUpcoming(null);
                        setSelectedYear(null);
                        setCurrentPage(1);
                        localStorage.removeItem('gameFilters');
                      }}
                      className="text-sm font-semibold transition px-2 py-1.5 bg-gradient-red rounded-md"
                    >
                      Reset all filters
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {filtered.length === 0 ? (
        loadingGames ? (
          isMobile ? (
            <div className="overflow-y-auto min-w-full pb-8">
              <div className="flex flex-col gap-5">
                {Array.from({ length: Math.min(itemsPerPage, 5) }).map((_, i) => (
                  <div key={i} className="rounded-2xl overflow-hidden transition-all duration-300 relative border border-white/10 bg-white/5 backdrop-blur-sm shadow-xl p-4">
                    <div className="flex gap-4 items-start">
                      <div className="w-32 aspect-[3/4] bg-white/10 animate-pulse rounded-xl" />
                      <div className="flex-1 space-y-3 py-1">
                        <div className="h-6 bg-white/10 rounded-lg animate-pulse w-3/4" />
                        <div className="h-4 bg-white/10 rounded-lg animate-pulse w-1/2" />
                        <div className="h-3 bg-white/10 rounded-lg animate-pulse w-1/3" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="w-full max-w-full overflow-x-auto custom-scrollbar bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-2xl relative">
              <table className="w-full border-collapse min-w-[1200px]">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="px-6 py-8 sticky left-0 z-30 text-left">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Game</span>
                        <span className="text-[9px] font-bold text-white/60 uppercase tracking-widest italic opacity-60">Click for details</span>
                      </div>
                    </th>
                    <th className="px-6 py-8">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Release Date</span>
                    </th>
                    <th className="px-6 py-8">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Developers</span>
                    </th>
                    <th className="px-6 py-8">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Editors</span>
                    </th>
                    <th className="px-6 py-8">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Platforms</span>
                    </th>
                    <th className="px-6 py-8">
                      <div className="flex flex-col gap-1 items-center">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Ratings</span>
                        <div className="flex gap-4 text-[8px] font-bold uppercase tracking-widest text-white/20">
                          <span>Critics</span>
                          <span>Players</span>
                        </div>
                      </div>
                    </th>
                    {edit && (
                      <th className="px-6 py-8 sticky right-0 z-30">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Actions</span>
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {Array.from({ length: itemsPerPage }).map((_, idx) => (
                    <tr key={idx} className="animate-pulse">
                      <td className="px-6 py-6 sticky left-0 z-20">
                        <div className="flex items-center gap-6">
                          <div className="w-16 aspect-[3/4] bg-white/5 rounded-lg shrink-0 shadow-inner" />
                          <div className="space-y-2 flex-1">
                            <div className="h-4 bg-white/5 rounded-full w-32" />
                            <div className="h-3 bg-white/5 rounded-full w-20" />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6"><div className="h-4 bg-white/5 rounded-full w-24 mx-auto" /></td>
                      <td className="px-6 py-6"><div className="h-4 bg-white/5 rounded-full w-32 mx-auto" /></td>
                      <td className="px-6 py-6"><div className="h-4 bg-white/5 rounded-full w-28 mx-auto" /></td>
                      <td className="px-6 py-6 border-l border-white/5"><div className="h-8 bg-white/5 rounded-xl w-24 mx-auto" /></td>
                      {edit && <td className="px-6 py-6 sticky right-0 z-20"><div className="h-10 bg-white/5 rounded-xl w-20 mx-auto" /></td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          <div className="w-full py-20 flex flex-col items-center justify-center bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] gap-4">
            <p className="text-center italic text-white/40 font-bold uppercase tracking-widest text-xs">No games found with the current filters !</p>
            <button
              onClick={() => {
                setSelectedPlatforms([]);
                setShowOnlyUpcoming(null);
                setSelectedYear(null);
                localStorage.removeItem('gameFilters');
              }}
              className="text-[10px] font-black uppercase tracking-widest px-4 py-2 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 transition-colors"
            >
              Clear all filters
            </button>
          </div>
        )
      ) : (
        isMobile ? (
          <div className="overflow-y-auto min-w-full pb-8">
            <div className="flex flex-col gap-5">
              {filtered
                .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                .map((game, index) => (
                  <GameCard
                    key={game.id}
                    ref={index === 0 ? firstItemRef : null}
                    game={game}
                    forceOpen={featuredOpen === game.id}
                    setForceOpen={() => setFeaturedOpen(null)}
                    coverImage={coverMap ? coverMap[game.igdb_id] : []}
                  />
                ))}
            </div>
            <Pagination
              totalItems={filtered.length}
              itemsPerPage={itemsPerPage}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
              isMobile={isMobile}
            />
          </div>
        ) : (
          <>
            <div className="w-full max-w-full overflow-x-auto custom-scrollbar bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-2xl relative">
              <table className="w-full border-collapse min-w-[1200px]">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="px-6 py-8 sticky left-0 z-20 text-left">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80">Game</span>
                        <span className="text-[9px] font-bold text-white/60 uppercase tracking-widest italic opacity-60">Click for details</span>
                      </div>
                    </th>
                    <th className="px-6 py-8">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80">Release Date</span>
                    </th>
                    <th className="px-6 py-8">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80">Developers</span>
                    </th>
                    <th className="px-6 py-8">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80">Editors</span>
                    </th>
                    <th className="px-6 py-8">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80">Platforms</span>
                    </th>
                    <th className="px-6 py-8">
                      <div className="flex flex-col gap-1 items-center">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80">Ratings</span>
                        <div className="flex gap-4 text-[8px] font-bold uppercase tracking-widest text-white/20">
                          <span>Critics</span>
                          <span>Players</span>
                        </div>
                      </div>
                    </th>
                    {edit && (
                      <th className="px-6 py-8 sticky right-0 z-30">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80">Actions</span>
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filtered
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map((game, index) => (
                      <GameRow
                        ref={index === 0 ? firstItemRef : null}
                        key={game.id}
                        game={game}
                        coverImage={coverMap ? coverMap[game.igdb_id] : []}
                        screenshots={screenshotsMap ? screenshotsMap[game.igdb_id] : []}
                      />
                    ))}
                </tbody>
              </table>
            </div>
            <div className="mt-8">
              <Pagination
                totalItems={filtered.length}
                itemsPerPage={itemsPerPage}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={setItemsPerPage}
                isMobile={isMobile}
              />
            </div>
          </>
        )
      )}
    </div>
  );
};

export default GamesView;