import GameRow from "./GameRow";
import GameCard from "./GameCard";
import AddGameForm from "../modals/AddGameForm";
import EditGameForm from "../modals/EditGameForm";
import LoginForm from "../modals/LoginForm";
import { useEffect, useRef, useState } from "react";
import { Timestamp } from "firebase/firestore";
import { FaFilter } from "react-icons/fa";
import { useGame } from "../../contexts/GameContext";
import FeaturedGames from "./FeaturedGames";
import { FaChevronRight, FaChevronLeft } from "react-icons/fa6";
import { MdKeyboardDoubleArrowRight, MdKeyboardDoubleArrowLeft } from "react-icons/md";
import { getPaginationRange } from "../../js/utils";
import FilterButton from "../shared/FilterButton";

const GamesView = () => {
  const {
    games,
    search,
    isLogged,
    edit,
    isModalOpen,
    featuredOpen,
    setFeaturedOpen,
    gameToEdit,
    handleCloseModal,
    coverMap,
    screenshotsMap,
    loading,
    itemsPerPage,
    currentPage,
    setCurrentPage,
    timesToBeat,
  } = useGame();
  const [withRelease, setWithRelease] = useState(true);
  const isFirstRender = useRef(true);
  const firstItemRef = useRef(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState(() => {
    const saved = localStorage.getItem('gameFilters');
    return saved ? JSON.parse(saved).selectedPlatforms || [] : [];
  });
  const [showOnlyUpcoming, setShowOnlyUpcoming] = useState(() => {
    const saved = localStorage.getItem('gameFilters');
    return saved ? JSON.parse(saved).showOnlyUpcoming ?? null : null
  });
  const [showThisYearOnly, setShowThisYearOnly] = useState(() => {
    const saved = localStorage.getItem('gameFilters');
    return saved ? JSON.parse(saved).showThisYearOnly ?? false : false;
  });
  const [filtersVisible, setFiltersVisible] = useState(() => {
    const saved = localStorage.getItem('gameFilters');
    if (saved) {
      const {
        selectedPlatforms = [],
        showOnlyUpcoming = null,
        showThisYearOnly = true,
      } = JSON.parse(saved);
      return (selectedPlatforms.length > 0 || showOnlyUpcoming !== null || showThisYearOnly);
    }
    return false;
  });
  const [openRowId, setOpenRowId] = useState(null);

  function useMediaQuery(query) {
    const [matches, setMatches] = useState(() => window.matchMedia(query).matches);

    useEffect(() => {
      const media = window.matchMedia(query);
      const listener = () => setMatches(media.matches);
      media.addListener(listener);
      return () => media.removeListener(listener);
    }, [query]);

    return matches;
  }

  useEffect(() => {
    const filters = {
      selectedPlatforms,
      showOnlyUpcoming,
      withRelease,
      showThisYearOnly,
    };
    localStorage.setItem('gameFilters', JSON.stringify(filters));
  }, [selectedPlatforms, showOnlyUpcoming, withRelease, showThisYearOnly]);

  useEffect(() => {
    setOpenRowId(null);
  }, [search, selectedPlatforms, showOnlyUpcoming, withRelease, showThisYearOnly]);


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

      if (release_date === "TBA") {
        return Infinity;
      }
    }

    return Infinity;
  };

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

  const platformLabels = {
    pc: "PC",
    ps: "PlayStation",
    xbox: "Xbox",
    switch: "Switch",
    switch_2: "Switch 2"
  };

  const filtered = games
    .filter(game => {
      if (withRelease) {
        return game.release_date instanceof Timestamp;
      } else {
        return typeof game.release_date === "string";
      }
    })
    .filter(game => {
      // Search
      const matchesSearch = game.name.toLowerCase().includes(search.toLowerCase()) ||
        game.developers.some(dev => dev.name.toLowerCase().includes(search.toLowerCase())) ||
        game.editors.some(editor => editor.name.toLowerCase().includes(search.toLowerCase()));

      // Platforms
      const matchesPlatform = selectedPlatforms.length === 0 || selectedPlatforms.every(platform =>
        getPlatformArray(game.platforms).includes(platform)
      );

      const isTimestamp = game.release_date instanceof Timestamp;
      const now = new Date();
      const currentYear = now.getFullYear();

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

    if (firstItemRef.current) {
      const headerHeight = 325;
      const top = firstItemRef.current.getBoundingClientRect().top + window.scrollY - headerHeight;

      window.scrollTo({ top, behavior: 'smooth', });
    }
  }, [currentPage]);

  const isSmallScreen = useMediaQuery('(max-width: 639px)');

  if (loading) {
    return (
      <>
        <FeaturedGames games={games} />
        <div className="w-full flex flex-col items-center mt-8">
          {[...Array(1)].map((_, i) => (
            <div
              key={i}
              className="w-full max-w-2xl h-20 bg-gray-200 animate-pulse rounded-lg mb-4"
            />
          ))}
        </div>
      </>
    );
  }

  return (
    <div className="px-6 w-full flex flex-col gap-6 pb-4">
      <FeaturedGames games={games} />

      <div className="w-full flex justify-center">
        <div className="border-primary rounded-xl">
          <div className="flex flex-row gap-4 items-center justify-center p-2 rounded-md">
            <button
              className={`${withRelease && "bg-gradient-primary text-white"} disabled:scale-100 hover:scale-105 w-fit px-2 py-1.5 sm:px-3 sm:py-2 rounded-md text-sm sm:text-base transition`}
              onClick={() => setWithRelease(true)}
              disabled={withRelease}
            >
              With release date
            </button>
            <button
              className={`${!withRelease && "bg-gradient-primary text-white"} disabled:scale-100 hover:scale-105 w-fit px-2 py-1.5 sm:px-3 sm:py-2 rounded-md text-sm sm:text-base transition`}
              onClick={() => setWithRelease(false)}
              disabled={!withRelease}
            >
              Without release date
            </button>
          </div>
        </div>
      </div>

      <div className="w-full flex flex-col items-end">
        {/* Toggle Button */}
        <div className="flex justify-center">
          <button
            className="flex items-center text-sm gap-2 px-3 py-1.5 bg-gradient-primary text-white rounded-md hover:bg-gradient-primary transition"
            onClick={() => setFiltersVisible(prev => !prev)}
          >
            <FaFilter />
            {filtersVisible ? "Hide Filters" : "Show Filters"}
          </button>
        </div>
        {/* Filters */}
        <div
          className={`overflow-hidden transition-all duration-500 ease-in-out w-full ${filtersVisible ? "max-h-[1000px] opacity-100 py-4" : "max-h-0 opacity-0"
            }`}
        >
          <div className="flex flex-col gap-4 items-center md:flex-row md:items-center md:justify-center md:flex-wrap w-full">
            <div className="flex justify-center gap-1 md:justify-start">
              <FilterButton
                isVisible={filtersVisible}
                filterCondition={showThisYearOnly}
                onClick={() => setShowThisYearOnly(prev => !prev)}
                text="This year"
              />
            </div>
            {/* Platform Filter */}
            <div className="flex flex-wrap justify-center gap-1 md:justify-start">
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
            {/* Release Status Filter */}
            <div className="flex flex-wrap justify-center gap-1 md:justify-start">
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
            {/* Reset */}
            <div className="flex justify-center gap-1 md:justify-start">
              <FilterButton
                isVisible={filtersVisible}
                extraClasses="rounded-md bg-gradient-primary"
                onClick={() => {
                  setSelectedPlatforms([]);
                  setShowOnlyUpcoming(null);
                  setShowThisYearOnly(false);
                  localStorage.removeItem('gameFilters');
                }}
                text="Reset filters"
              />
            </div>
          </div>
        </div>
      </div>

      {isSmallScreen ? (
        <div className="overflow-y-auto min-w-full sm:hidden pb-8">
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
          <div className="flex justify-center items-center gap-3 mt-4 sm:hidden">
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
          <div className="flex-col max-w-full overflow-x-auto hidden sm:flex">
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
                        times={timesToBeat ? timesToBeat[game.igdb_id] : []}
                        isOpen={openRowId === game.id}
                        onToggle={() => setOpenRowId(prev => prev === game.id ? null : game.id)}
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
      )}

      {isModalOpen && (
        isLogged ? (
          edit ? (
            <EditGameForm
              game={gameToEdit}
              games={games}
              onSuccess={handleCloseModal}
            />
          ) : (
            <AddGameForm
              games={games}
              onClose={handleCloseModal}
              onSuccess={handleCloseModal}
            />
          )
        ) : (
          <LoginForm
            onSuccess={handleCloseModal}
            onClose={handleCloseModal}
          />
        )
      )}
    </div>
  )
}

export default GamesView;