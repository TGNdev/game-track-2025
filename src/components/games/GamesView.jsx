import GameRow from "./GameRow";
import GameCard from "./GameCard";
import { useEffect, useMemo, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Timestamp } from "firebase/firestore";
import { FaFilter } from "react-icons/fa";
import FeaturedGames from "./FeaturedGames";
import { FaChevronRight, FaChevronLeft } from "react-icons/fa6";
import { MdKeyboardDoubleArrowRight, MdKeyboardDoubleArrowLeft } from "react-icons/md";
import { getPaginationRange } from "../../js/utils";
import FilterButton from "../shared/FilterButton";
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
    isMobile,
    selectedPlatforms,
    showOnlyUpcoming,
    showThisYearOnly,
    withRelease,
    setWithRelease,
    filtersVisible,
    setFiltersVisible,
    setSelectedPlatforms,
    setShowOnlyUpcoming,
    setShowThisYearOnly,
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



  useEffect(() => {
    const filters = {
      selectedPlatforms,
      showOnlyUpcoming,
      withRelease,
      showThisYearOnly,
    };
    localStorage.setItem('gameFilters', JSON.stringify(filters));
  }, [selectedPlatforms, showOnlyUpcoming, withRelease, showThisYearOnly]);

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
    const currentYear = now.getFullYear();
    const q = search.toLowerCase();

    return games
      .filter((game) => {
        if (withRelease) return game.release_date instanceof Timestamp;
        return typeof game.release_date === "string";
      })
      .filter((game) => {
        const matchesSearch =
          game.name.toLowerCase().includes(q) ||
          game.developers.some((dev) => dev.name.toLowerCase().includes(q)) ||
          game.editors.some((editor) => editor.name.toLowerCase().includes(q));

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
        if (showThisYearOnly) {
          if (isTimestamp) {
            const release = new Date(game.release_date.seconds * 1000);
            matchesYear = release.getFullYear() === currentYear;
          } else if (typeof game.release_date === "string") {
            const yearMatch = game.release_date.match(/\b(\d{4})\b/);
            matchesYear = yearMatch ? parseInt(yearMatch[1]) === currentYear : false;
          } else {
            matchesYear = false;
          }
        }

        return matchesSearch && matchesPlatform && matchesReleaseStatus && matchesYear;
      })
      .sort((a, b) => {
        const aSort = getSortValue(a.release_date);
        const bSort = getSortValue(b.release_date);
        if (aSort !== bSort) return aSort - bSort;
        return a.name.localeCompare(b.name);
      });
  }, [games, search, selectedPlatforms, showOnlyUpcoming, withRelease, showThisYearOnly]);

  const filteredUsers = useMemo(() => {
    if (!search || search.length < 2) return [];
    const q = search.toLowerCase();
    return users.filter(user => user.username.toLowerCase().includes(q));
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

  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    }
  }, [isModalOpen]);

  useEffect(() => {
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
  }, [search, selectedPlatforms, showOnlyUpcoming, withRelease, showThisYearOnly, setCurrentPage]);

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

      <div className="w-full flex justify-center">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-1 shadow-2xl relative overflow-hidden">
          <div className="flex flex-row gap-4 items-center justify-center p-2 rounded-md">
            <button
              className={`${withRelease && "bg-gradient-primary"} disabled:scale-100 w-fit px-2 py-1.5 sm:px-3 sm:py-2 rounded-md text-sm sm:text-base`}
              onClick={() => setWithRelease(true)}
              disabled={withRelease}
            >
              With release date
            </button>
            <button
              className={`${!withRelease && "bg-gradient-primary"} disabled:scale-100 w-fit px-2 py-1.5 sm:px-3 sm:py-2 rounded-md text-sm sm:text-base`}
              onClick={() => setWithRelease(false)}
              disabled={!withRelease}
            >
              Without release date
            </button>
          </div>
        </div>
      </div>

      <div className="w-full flex flex-col items-center">
        <button
          className="flex items-center text-sm gap-2 px-2 py-1.5 bg-gradient-primary rounded-md hover:scale-105 transition-transform shadow-lg z-10"
          onClick={() => setFiltersVisible(prev => !prev)}
        >
          <FaFilter />
          {filtersVisible ? "Hide Filters" : "Show Filters"}
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
                      <div className="flex justify-center gap-2">
                        <FilterButton
                          isVisible={filtersVisible}
                          filterCondition={showThisYearOnly}
                          onClick={() => setShowThisYearOnly(prev => !prev)}
                          text="This year"
                        />
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
                          onClick={() => setShowOnlyUpcoming(true)}
                          text="Upcoming only"
                        />
                        <FilterButton
                          isVisible={filtersVisible}
                          filterCondition={showOnlyUpcoming === false}
                          onClick={() => setShowOnlyUpcoming(false)}
                          text="Already released"
                        />
                        <FilterButton
                          isVisible={filtersVisible}
                          filterCondition={showOnlyUpcoming === null}
                          onClick={() => setShowOnlyUpcoming(null)}
                          text="All"
                        />
                      </div>
                    </div>
                  )}
                  <div className="pt-4 border-t border-white/10 w-full flex justify-center">
                    <button
                      onClick={() => {
                        setSelectedPlatforms([]);
                        setShowOnlyUpcoming(null);
                        setShowThisYearOnly(false);
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
            <div className="flex-col max-w-full overflow-x-auto flex">
              <div className="relative">
                <table className="w-full border-collapse min-w-[1200px]">
                  <thead className="border-b">
                    <tr>
                      <th className="p-3 sticky left-0 bg-sticky-column z-10 flex flex-col items-center">
                        <div>Name</div>
                        <div className="text-xs opacity-50">Click to open details</div>
                      </th>
                      <th className="p-3">Release Date</th>
                      <th className="p-3">Developers</th>
                      <th className="p-3">Editors</th>
                      <th className="p-3">Platforms</th>
                      <th className="p-3 flex flex-col">
                        <div>Ratings</div>
                        <div className="flex flex-row gap-x-3 justify-center">
                          <div className="text-xs opacity-50">Critics</div>
                          <div className="text-xs opacity-50">Players</div>
                        </div>
                      </th>
                      {edit && (
                        <th className="p-3 sticky right-0 bg-sticky-column z-10">Edit actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: itemsPerPage }).map((_, idx) => (
                      <tr key={idx} className="animate-pulse">
                        <td className="p-3 sticky left-0 bg-sticky-column z-20 w-80">
                          <div className="flex items-center text-left gap-8 border-r">
                            <div className="relative w-24 aspect-[3/4] overflow-visible shrink-0">
                              <div className="w-full h-full bg-white/5 rounded-lg" />
                            </div>
                            <div className="flex-1">
                              <div className="h-6 bg-white/5 rounded-lg w-1/2 mb-2" />
                              <div className="h-4 bg-white/5 rounded-lg w-1/3" />
                            </div>
                          </div>
                        </td>
                        <td className="p-3"><div className="h-4 bg-white/5 rounded w-24 m-auto" /></td>
                        <td className="p-3"><div className="h-4 bg-white/5 rounded w-32 m-auto" /></td>
                        <td className="p-3"><div className="h-4 bg-white/5 rounded w-28 m-auto" /></td>
                        <td className="p-3"><div className="h-4 bg-white/5 rounded w-40 m-auto" /></td>
                        <td className="p-3"><div className="h-8 bg-white/5 rounded-xl w-24 m-auto" /></td>
                        {edit && <td className="p-3"><div className="h-8 bg-white/5 rounded-xl w-20 m-auto" /></td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        ) : (
          <div className="w-full flex justify-center items-center">
            <p className="text-center italic">No games found with the current filters !</p>
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
            <div className="flex justify-center items-center gap-3 mt-10">
              <button
                className="px-3 py-1 bg-gradient-primary rounded disabled:opacity-50"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(1)}
              >
                <MdKeyboardDoubleArrowLeft />
              </button>
              <button
                className="px-3 py-1 border rounded text-sm disabled:opacity-50"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                <FaChevronLeft />
              </button>
              <span className="text-sm">
                {currentPage} / {Math.ceil(filtered.length / itemsPerPage)}
              </span>
              <button
                className="px-3 py-1 border rounded text-sm disabled:opacity-50"
                disabled={currentPage === Math.ceil(filtered.length / itemsPerPage)}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                <FaChevronRight />
              </button>
              <button
                className="px-3 py-1 bg-gradient-primary rounded text-sm flex disabled:opacity-50"
                disabled={currentPage === Math.ceil(filtered.length / itemsPerPage)}
                onClick={() => setCurrentPage(Math.ceil(filtered.length / itemsPerPage))}
              >
                <MdKeyboardDoubleArrowRight />
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-col max-w-full overflow-x-auto flex">
              <div className="relative">
                <table className="w-full border-collapse min-w-[1200px]">
                  <thead className="border-b">
                    <tr>
                      <th className="p-3 sticky left-0 bg-sticky-column z-10 flex flex-col items-center">
                        <div>Name</div>
                        <div className="text-xs opacity-50">Click to open details</div>
                      </th>
                      <th className="p-3">Release Date</th>
                      <th className="p-3">Developers</th>
                      <th className="p-3">Editors</th>
                      <th className="p-3">Platforms</th>
                      <th className="p-3 flex flex-col">
                        <div>Ratings</div>
                        <div className="flex flex-row gap-x-3 justify-center">
                          <div className="text-xs opacity-50">Critics</div>
                          <div className="text-xs opacity-50">Players</div>
                        </div>
                      </th>
                      {edit && (
                        <th className="p-3 sticky right-0 bg-sticky-column z-10">Edit actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
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
            </div>
            {filtered.length > itemsPerPage && (
              <div className="flex justify-center mt-6 gap-2 flex-wrap">
                <button
                  className="px-3 py-1 bg-gradient-primary rounded disabled:opacity-50"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <FaChevronLeft />
                </button>

                {getPaginationRange(filtered.length, itemsPerPage, currentPage).map((page, i) =>
                  page === '...' ? (
                    <span key={i} className="px-3 py-1">
                      ...
                    </span>
                  ) : (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(page)}
                      className={`size-9 rounded ${currentPage === page ? 'bg-gradient-primary' : 'border-primary'
                        }`}
                      disabled={currentPage === page}
                    >
                      {page}
                    </button>
                  )
                )}

                <button
                  className="px-3 py-1 bg-gradient-primary rounded disabled:opacity-50"
                  onClick={() =>
                    setCurrentPage(prev =>
                      Math.min(prev + 1, Math.ceil(filtered.length / itemsPerPage))
                    )
                  }
                  disabled={currentPage === Math.ceil(filtered.length / itemsPerPage)}
                >
                  <FaChevronRight />
                </button>
              </div>
            )}
          </>
        )
      )}
    </div>
  )
}

export default GamesView;