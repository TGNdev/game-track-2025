import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { getTgaFromFirestore, getGamesFromFirestore } from "../js/firebase";
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

export const GameDataProvider = ({ children }) => {
  const [games, setGames] = useState([]);
  const [loadingGames, setLoadingGames] = useState(false);
  const [gamesError, setGamesError] = useState(null);

  const gamesLoadPromiseRef = useRef(null);
  const didAttemptInitialGamesLoadRef = useRef(false);

  const [awardWinners, setAwardWinners] = useState(new Set());
  const [awardsPerGame, setAwardsPerGame] = useState({});

  const [coverMap, setCoverMap] = useState({});
  const [screenshotsMap, setScreenshotsMap] = useState({});
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

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { winners, perGame } = await loadAwardData();
      if (cancelled) return;
      setAwardWinners(winners);
      setAwardsPerGame(perGame);
    })();

    return () => {
      cancelled = true;
    };
  }, [loadAwardData]);

  const ensureGamesLoaded = useCallback(async () => {
    if (games.length > 0) return games;

    if (!gamesLoadPromiseRef.current) {
      gamesLoadPromiseRef.current = (async () => {
        try {
          setGamesError(null);
          setLoadingGames(true);
          const list = await getGamesFromFirestore();
          setGames(list);
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
  }, [games]);

  useEffect(() => {
    if (didAttemptInitialGamesLoadRef.current) return;
    didAttemptInitialGamesLoadRef.current = true;
    ensureGamesLoaded().catch(() => { });
  }, [ensureGamesLoaded]);

  const value = useMemo(
    () => ({
      games,
      setGames,
      loadingGames,
      gamesError,
      ensureGamesLoaded,

      awardWinners,
      setAwardWinners,
      awardsPerGame,
      setAwardsPerGame,
      hasWonAward,

      coverMap,
      setCoverMap,
      screenshotsMap,
      setScreenshotsMap,
      timesToBeat,
      setTimesToBeat,
    }),
    [
      games,
      loadingGames,
      gamesError,
      ensureGamesLoaded,
      awardWinners,
      awardsPerGame,
      hasWonAward,
      coverMap,
      screenshotsMap,
      timesToBeat,
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
