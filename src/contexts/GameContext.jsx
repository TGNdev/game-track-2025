import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { auth, getTgaFromFirestore, getGamesFromFirestore } from "../js/firebase";
import { slugify } from "../js/utils";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { toast } from "react-toastify";
import { ReactComponent as XboxIcon } from "../assets/icons/xbox.svg";
import { ReactComponent as PsIcon } from "../assets/icons/ps.svg";
import { ReactComponent as PcIcon } from "../assets/icons/pc.svg";
import { ReactComponent as SwitchIcon } from "../assets/icons/switch.svg";
import { ReactComponent as Switch2Icon } from "../assets/icons/switch_2.svg";

const GameContext = createContext(null);

const AWARD_WINNERS_CACHE_KEY = "tgaAwardWinners";
const AWARDS_PER_GAME_CACHE_KEY = "tgaAwardsPerGame";
const TTL = 1000 * 60 * 60 * 24 * 10; // 10 days
const MOBILE_BREAKPOINT = 768;

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
  } catch {
    // ignore
  }
};

export const GameProvider = ({ children }) => {
  const [games, setGames] = useState([]);
  const [loadingGames, setLoadingGames] = useState(false);
  const [gamesError, setGamesError] = useState(null);

  const gamesLoadPromiseRef = useRef(null);
  const didAttemptInitialGamesLoadRef = useRef(false);

  const [viewGames, setViewGames] = useState(true);
  const [search, setSearch] = useState("");
  const [opened, setOpened] = useState(false);
  const [isLogged, setIsLogged] = useState(false);
  const [edit, setEdit] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [featuredOpen, setFeaturedOpen] = useState(null);
  const [gameToEdit, setGameToEdit] = useState(null);
  const [coverMap, setCoverMap] = useState({});
  const [screenshotsMap, setScreenshotsMap] = useState({});
  const [timesToBeat, setTimesToBeat] = useState({});
  const [gameToSee, setGameToSee] = useState(null);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [openSearch, setOpenSearch] = useState(false);
  const [awardWinners, setAwardWinners] = useState(new Set());
  const [awardsPerGame, setAwardsPerGame] = useState({});
  const [isAwardsModalOpen, setIsAwardsModalOpen] = useState(false);

  const [isMobile, setIsMobile] = useState(() =>
    hasWindow ? window.innerWidth <= MOBILE_BREAKPOINT : false
  );

  const [showTimesDisclaimer, setShowTimesDisclaimer] = useState(() => {
    const stored = safeLocalStorageGet("showTimesDisclaimer");
    if (stored === null) return true;
    try {
      return JSON.parse(stored);
    } catch {
      return true;
    }
  });

  const openButtonRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLogged(!!user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!hasWindow) return;

    const handleResize = () => setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    safeLocalStorageSet("showTimesDisclaimer", JSON.stringify(showTimesDisclaimer));
  }, [showTimesDisclaimer]);

  const hasWonAward = useCallback(
    (gameId) => awardWinners.has(gameId),
    [awardWinners]
  );

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      setIsModalOpen(false);
      setEdit(false);
      toast.success("Admin... Going dark.");
    } catch (e) {
      console.error("Error logging out: ", e);
      throw e;
    }
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const getPlatformsSvg = useCallback((platform, isCard = false) => {
    let base = "size-8 rounded p-1.5";
    if (isCard) base = "size-5 p-1";

    switch (platform) {
      case "xbox":
        return <XboxIcon className={`${base} bg-green-500`} fill="white" />;
      case "ps":
        return <PsIcon className={`${base} bg-blue-500`} fill="white" />;
      case "pc":
        return <PcIcon className={`${base} bg-slate-400`} fill="white" />;
      case "switch":
        return <SwitchIcon className={`${base} bg-red-500`} fill="white" />;
      case "switch_2":
        return <Switch2Icon className={`${base} bg-red-500`} fill="white" />;
      default:
        return null;
    }
  }, []);

  const isReleased = useCallback((date) => {
    const today = new Date();
    const releaseDate = new Date(date.seconds * 1000);
    return releaseDate < today;
  }, []);

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
        JSON.stringify({ data: Array.from(winnersSet), expiresAt: Date.now() + TTL })
      );
      safeLocalStorageSet(
        AWARDS_PER_GAME_CACHE_KEY,
        JSON.stringify({ data: perGameMap, expiresAt: Date.now() + TTL })
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
    ensureGamesLoaded().catch(() => {
      // already handled in ensureGamesLoaded
    });
  }, [ensureGamesLoaded]);

  const value = useMemo(() => {
    return {
      games,
      setGames,
      loadingGames,
      gamesError,
      ensureGamesLoaded,

      viewGames,
      setViewGames,
      search,
      setSearch,
      opened,
      setOpened,
      isLogged,
      setIsLogged,
      edit,
      setEdit,
      isModalOpen,
      setIsModalOpen,
      featuredOpen,
      setFeaturedOpen,
      gameToEdit,
      setGameToEdit,
      logout,
      handleCloseModal,
      getPlatformsSvg,
      isReleased,
      coverMap,
      setCoverMap,
      screenshotsMap,
      setScreenshotsMap,
      gameToSee,
      setGameToSee,
      itemsPerPage,
      setItemsPerPage,
      currentPage,
      setCurrentPage,
      openSearch,
      setOpenSearch,
      openButtonRef,
      timesToBeat,
      setTimesToBeat,
      awardWinners,
      setAwardWinners,
      hasWonAward,
      awardsPerGame,
      setAwardsPerGame,
      showTimesDisclaimer,
      setShowTimesDisclaimer,
      setIsAwardsModalOpen,
      isAwardsModalOpen,
      isMobile,
      setIsMobile,
    };
  }, [
    games,
    loadingGames,
    gamesError,
    ensureGamesLoaded,
    viewGames,
    search,
    opened,
    isLogged,
    edit,
    isModalOpen,
    featuredOpen,
    gameToEdit,
    logout,
    handleCloseModal,
    getPlatformsSvg,
    isReleased,
    coverMap,
    screenshotsMap,
    gameToSee,
    itemsPerPage,
    currentPage,
    openSearch,
    timesToBeat,
    awardWinners,
    hasWonAward,
    awardsPerGame,
    showTimesDisclaimer,
    isAwardsModalOpen,
    isMobile,
  ]);

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

export const useGame = () => {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within a GameProvider");
  return ctx;
};
