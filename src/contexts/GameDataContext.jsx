import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { getTgaFromFirestore, getGamesFromFirestore, getUsersFromFirestore, getWatchFromFirestore, getWatchStoriesFromFirestore, getCompaniesFromFirestore } from "../js/firebase";
import { slugify } from "../js/utils";
import { TTL } from "../js/cache";

const GameDataContext = createContext(null);

const AWARD_WINNERS_CACHE_KEY = "tgaAwardWinners";
const AWARDS_PER_GAME_CACHE_KEY = "tgaAwardsPerGame";

const hasWindow = typeof window !== "undefined";
const safeLocalStorageGet = (key) => {
  if (!hasWindow) return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};
const safeLocalStorageSet = (key, value) => {
  if (!hasWindow) return;
  try {
    window.localStorage.setItem(key, value);
  } catch { }
};
const safeLocalStorageRemove = (key) => {
  if (!hasWindow) return;
  try {
    window.localStorage.removeItem(key);
  } catch { }
};

export const GameDataProvider = ({ children }) => {
  const [games, setGames] = useState([]);
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loadingGames, setLoadingGames] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [loadingWatch, setLoadingWatch] = useState(false);
  const [gamesError, setGamesError] = useState(null);

  const gamesLoadPromiseRef = useRef(null);
  const usersLoadPromiseRef = useRef(null);
  const watchLoadPromiseRef = useRef(null);
  const companiesLoadPromiseRef = useRef(null);
  const didAttemptInitialGamesLoadRef = useRef(false);
  const didAttemptInitialUsersLoadRef = useRef(false);
  const didAttemptInitialWatchLoadRef = useRef(false);
  const didAttemptInitialCompaniesLoadRef = useRef(false);
  const gamesLoadedRef = useRef(false);
  const usersLoadedRef = useRef(false);
  const watchLoadedRef = useRef(false);
  const companiesLoadedRef = useRef(false);

  const [awardWinners, setAwardWinners] = useState(new Set());
  const [awardsPerGame, setAwardsPerGame] = useState({});

  const [watch, setWatch] = useState([]);
  const [watchStories, setWatchStories] = useState([]);

  const [coverMap, setCoverMap] = useState({});
  const [screenshotsMap, setScreenshotsMap] = useState({});
  const [videosMap, setVideosMap] = useState({});
  const [timesToBeat, setTimesToBeat] = useState({});

  const hasWonAward = useCallback(
    (gameId) => awardWinners.has(gameId),
    [awardWinners]
  );

  const loadAwardData = useCallback(async () => {
    try {
      const winnersCacheRaw = safeLocalStorageGet(AWARD_WINNERS_CACHE_KEY);
      const perGameCacheRaw = safeLocalStorageGet(AWARDS_PER_GAME_CACHE_KEY);

      if (winnersCacheRaw && perGameCacheRaw) {
        const { data: winnersData, expiresAt: winnersExpiresAt } =
          JSON.parse(winnersCacheRaw);
        const { data: perGameData, expiresAt: perGameExpiresAt } =
          JSON.parse(perGameCacheRaw);

        if (Date.now() < winnersExpiresAt && Date.now() < perGameExpiresAt) {
          return {
            winners: new Set(winnersData),
            perGame: perGameData || {},
          };
        }
      }

      const tgaList = await getTgaFromFirestore();
      const winnersSet = new Set();
      const perGameMap = {};

      for (const year of tgaList) {
        for (const award of year.awards || []) {
          const baseAwardInfo = {
            year: year.year,
            title: award.title,
            slug: slugify(award.title),
          };

          if (award.nominees?.length) {
            for (const nominee of award.nominees) {
              if (nominee.isWinner && nominee.gameId) {
                winnersSet.add(nominee.gameId);
                (perGameMap[nominee.gameId] ||= []).push(baseAwardInfo);
              }
            }
          } else if (award.gameId) {
            winnersSet.add(award.gameId);
            (perGameMap[award.gameId] ||= []).push(baseAwardInfo);
          }
        }
      }

      safeLocalStorageSet(
        AWARD_WINNERS_CACHE_KEY,
        JSON.stringify({
          data: Array.from(winnersSet),
          expiresAt: Date.now() + TTL,
        })
      );
      safeLocalStorageSet(
        AWARDS_PER_GAME_CACHE_KEY,
        JSON.stringify({
          data: perGameMap,
          expiresAt: Date.now() + TTL,
        })
      );

      return { winners: winnersSet, perGame: perGameMap };
    } catch (e) {
      console.error("Failed to load TGA award data:", e);
      return { winners: new Set(), perGame: {} };
    }
  }, []);

  const refreshTgaData = useCallback(async () => {
    safeLocalStorageRemove(AWARD_WINNERS_CACHE_KEY);
    safeLocalStorageRemove(AWARDS_PER_GAME_CACHE_KEY);
    const { winners, perGame } = await loadAwardData();
    setAwardWinners(winners);
    setAwardsPerGame(perGame);
  }, [loadAwardData]);


  useEffect(() => {
    let cancelled = false;

    const performLoad = async () => {
      const { winners, perGame } = await loadAwardData();
      if (cancelled) return;
      setAwardWinners(winners);
      setAwardsPerGame(perGame);
    };

    performLoad();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        performLoad();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [loadAwardData]);

  const ensureCompaniesLoaded = useCallback(async () => {
    if (companiesLoadedRef.current) return companies;

    if (!companiesLoadPromiseRef.current) {
      companiesLoadPromiseRef.current = (async () => {
        try {
          setLoadingCompanies(true);
          const rawList = await getCompaniesFromFirestore();
          
          // Merge companies by slug to handle duplicates and reconcile data
          const mergedMap = {};
          rawList.forEach(company => {
            const slug = company.slug || slugify(company.name);
            if (!mergedMap[slug]) {
              mergedMap[slug] = {
                ...company,
                slug,
                allIds: [company.id],
                roles: company.roles || []
              };
            } else {
              const existing = mergedMap[slug];
              
              // Combine roles
              if (company.roles) {
                company.roles.forEach(role => {
                  if (!existing.roles.includes(role)) existing.roles.push(role);
                });
              }
              
              // Track all original IDs
              if (!existing.allIds.includes(company.id)) {
                existing.allIds.push(company.id);
              }
              
              // Reconcile metadata: prefer the one with more data
              const fieldsToMerge = ['logo', 'website', 'country', 'city', 'parentCompanyId', 'studios'];
              fieldsToMerge.forEach(field => {
                if (!existing[field] && company[field]) {
                  existing[field] = company[field];
                }
              });
            }
          });
          
          const list = Object.values(mergedMap);
          setCompanies(list);
          companiesLoadedRef.current = true;
          return list;
        } catch (e) {
          console.error("Failed to load companies:", e);
          throw e;
        } finally {
          setLoadingCompanies(false);
          companiesLoadPromiseRef.current = null;
        }
      })();
    }

    return companiesLoadPromiseRef.current;
  }, [companies]);

  const refreshCompaniesData = useCallback(async () => {
    companiesLoadedRef.current = false;
    companiesLoadPromiseRef.current = null;
    return await ensureCompaniesLoaded();
  }, [ensureCompaniesLoaded]);

  const ensureGamesLoaded = useCallback(async () => {
    if (gamesLoadedRef.current) return games;

    if (!gamesLoadPromiseRef.current) {
      gamesLoadPromiseRef.current = (async () => {
        try {
          setGamesError(null);
          setLoadingGames(true);
          // Load developers & editors along with games to ensure references are resolvable
          const [list] = await Promise.all([
            getGamesFromFirestore(),
            ensureCompaniesLoaded()
          ]);
          setGames(list);
          gamesLoadedRef.current = true;
          return list;
        } catch (e) {
          setGamesError(e);
          throw e;
        } finally {
          setLoadingGames(false);
          gamesLoadPromiseRef.current = null;
        }
      })();
    }

    return gamesLoadPromiseRef.current;
  }, [games, ensureCompaniesLoaded]);
  const refreshGamesData = useCallback(async () => {
    gamesLoadedRef.current = false;
    gamesLoadPromiseRef.current = null;
    return await ensureGamesLoaded();
  }, [ensureGamesLoaded]);

  useEffect(() => {
    if (didAttemptInitialGamesLoadRef.current) return;
    didAttemptInitialGamesLoadRef.current = true;
    ensureGamesLoaded().catch(() => { });

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        getGamesFromFirestore()
          .then(list => {
            setGames(list);
            gamesLoadedRef.current = true;
          })
          .catch(e => console.warn("Background refresh failed:", e));
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [ensureGamesLoaded]);

  const ensureUsersLoaded = useCallback(async () => {
    if (usersLoadedRef.current) return users;

    if (!usersLoadPromiseRef.current) {
      usersLoadPromiseRef.current = (async () => {
        try {
          setLoadingUsers(true);
          const list = await getUsersFromFirestore();
          setUsers(list);
          usersLoadedRef.current = true;
          return list;
        } catch (e) {
          console.error("Failed to load users:", e);
          throw e;
        } finally {
          setLoadingUsers(false);
          usersLoadPromiseRef.current = null;
        }
      })();
    }

    return usersLoadPromiseRef.current;
  }, [users]);

  const ensureWatchLoaded = useCallback(async () => {
    if (watchLoadedRef.current) return watch;

    if (!watchLoadPromiseRef.current) {
      watchLoadPromiseRef.current = (async () => {
        try {
          setLoadingWatch(true);
          const [list, storiesList] = await Promise.all([
            getWatchFromFirestore(),
            getWatchStoriesFromFirestore()
          ]);
          setWatch(list);
          setWatchStories(storiesList);
          watchLoadedRef.current = true;
          return { list, storiesList };
        } catch (e) {
          console.error("Failed to load watch data:", e);
          throw e;
        } finally {
          setLoadingWatch(false);
          watchLoadPromiseRef.current = null;
        }
      })();
    }

    return watchLoadPromiseRef.current;
  }, [watch]);

  const refreshWatchData = useCallback(async () => {
    watchLoadedRef.current = false;
    watchLoadPromiseRef.current = null;
    return await ensureWatchLoaded();
  }, [ensureWatchLoaded]);

  useEffect(() => {
    if (didAttemptInitialUsersLoadRef.current) return;
    didAttemptInitialUsersLoadRef.current = true;
    ensureUsersLoaded().catch(() => { });

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        getUsersFromFirestore()
          .then(list => {
            setUsers(list);
            usersLoadedRef.current = true;
          })
          .catch(() => { });
        ensureWatchLoaded().catch(() => { }); // Also check watch data
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [ensureUsersLoaded, ensureWatchLoaded]);

  useEffect(() => {
    if (didAttemptInitialWatchLoadRef.current) return;
    didAttemptInitialWatchLoadRef.current = true;
    ensureWatchLoaded().catch(() => { });
  }, [ensureWatchLoaded]);

  useEffect(() => {
    if (didAttemptInitialCompaniesLoadRef.current) return;
    didAttemptInitialCompaniesLoadRef.current = true;
    ensureCompaniesLoaded().catch(() => { });

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        getCompaniesFromFirestore()
          .then(list => {
            setCompanies(list);
            companiesLoadedRef.current = true;
          })
          .catch(() => { });
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [ensureCompaniesLoaded]);

  const value = useMemo(
    () => ({
      games,
      setGames,
      loadingGames,
      gamesError,
      ensureGamesLoaded,

      companies,
      setCompanies,
      loadingCompanies,
      ensureCompaniesLoaded,

      users,
      loadingUsers,
      ensureUsersLoaded,

      watch,
      setWatch,
      watchStories,
      setWatchStories,
      loadingWatch,
      ensureWatchLoaded,
      refreshWatchData,

      awardWinners,
      setAwardWinners,
      awardsPerGame,
      setAwardsPerGame,
      hasWonAward,

      coverMap,
      setCoverMap,
      screenshotsMap,
      setScreenshotsMap,
      videosMap,
      setVideosMap,
      timesToBeat,
      setTimesToBeat,
      refreshTgaData,
      refreshCompaniesData,
      refreshGamesData,
    }),
    [
      games,
      loadingGames,
      gamesError,
      ensureGamesLoaded,
      companies,
      loadingCompanies,
      ensureCompaniesLoaded,
      users,
      loadingUsers,
      ensureUsersLoaded,
      watch,
      watchStories,
      loadingWatch,
      ensureWatchLoaded,
      refreshWatchData,
      awardWinners,
      awardsPerGame,
      hasWonAward,
      coverMap,
      screenshotsMap,
      videosMap,
      timesToBeat,
      refreshTgaData,
      refreshCompaniesData,
      refreshGamesData,
    ]
  );

  return (
    <GameDataContext.Provider value={value}>
      {children}
    </GameDataContext.Provider>
  );
};

export const useGameData = () => {
  const ctx = useContext(GameDataContext);
  if (!ctx)
    throw new Error("useGameData must be used within GameDataProvider");
  return ctx;
};
