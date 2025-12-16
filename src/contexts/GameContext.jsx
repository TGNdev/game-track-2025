import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { auth, getTgaFromFirestore } from "../js/firebase";
import { slugify } from "../js/utils";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { toast } from "react-toastify";
import { ReactComponent as XboxIcon } from "../assets/icons/xbox.svg";
import { ReactComponent as PsIcon } from "../assets/icons/ps.svg";
import { ReactComponent as PcIcon } from "../assets/icons/pc.svg";
import { ReactComponent as SwitchIcon } from "../assets/icons/switch.svg";
import { ReactComponent as Switch2Icon } from "../assets/icons/switch_2.svg";

const GameContext = createContext();
const AWARD_WINNERS_CACHE_KEY = "tgaAwardWinners";
const AWARDS_PER_GAME_CACHE_KEY = "tgaAwardsPerGame";
const TTL = 1000 * 60 * 60 * 24 * 10; // 10 days

export const GameProvider = ({ children }) => {
  const [games, setGames] = useState([]);
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
  const [loading, setLoading] = useState(false);
  const [gameToSee, setGameToSee] = useState(null);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [openSearch, setOpenSearch] = useState(false);
  const [awardWinners, setAwardWinners] = useState(new Set());
  const [awardsPerGame, setAwardsPerGame] = useState({});
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 868);
  const [showTimesDisclaimer, setShowTimesDisclaimer] = useState(() => {
    try {
      const stored = localStorage.getItem("showTimesDisclaimer");
      if (stored === null) return true;
      return JSON.parse(stored);
    } catch {
      return true;
    }
  });
  const [isAwardsModalOpen, setIsAwardsModalOpen] = useState(false);

  const openButtonRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLogged(!!user);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchAwardsData = async () => {
      const { winners, perGame } = await loadAwardData();
      setAwardWinners(winners);
      setAwardsPerGame(perGame);
    };

    fetchAwardsData();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("showTimesDisclaimer", JSON.stringify(showTimesDisclaimer));
    } catch {
      // ignore storage errors
    }
  }, [showTimesDisclaimer]);

  const hasWonAward = useCallback(
    (gameId) => awardWinners.has(gameId),
    [awardWinners]
  );
  const logout = async () => {
    try {
      await signOut(auth);
      setIsModalOpen(false);
      setEdit(false);
      toast.success("Admin... Going dark.")
    } catch (e) {
      console.error("Error logging out: ", e);
      throw e;
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const getPlatformsSvg = (platform, isCard = false) => {
    var base = 'size-8 rounded p-1.5';
    if (isCard) {
      base = `size-5 p-1`;
    }

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
  };

  const isReleased = (date) => {
    const today = new Date();
    const releaseDate = new Date(date.seconds * 1000);
    return releaseDate < today;
  };

  const loadAwardData = async () => {
    try {
      const winnersCache = localStorage.getItem(AWARD_WINNERS_CACHE_KEY);
      const perGameCache = localStorage.getItem(AWARDS_PER_GAME_CACHE_KEY);

      if (winnersCache && perGameCache) {
        const { data: winnersData, expiresAt: winnersExpiresAt } = JSON.parse(winnersCache);
        const { data: perGameData, expiresAt: perGameExpiresAt } = JSON.parse(perGameCache);

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

          if (award.nominees && award.nominees.length > 0) {
            for (const nominee of award.nominees) {
              if (nominee.isWinner && nominee.gameId) {
                winnersSet.add(nominee.gameId);
                if (!perGameMap[nominee.gameId]) {
                  perGameMap[nominee.gameId] = [];
                }
                perGameMap[nominee.gameId].push(baseAwardInfo);
              }
            }
          } else if (award.gameId) {
            winnersSet.add(award.gameId);
            if (!perGameMap[award.gameId]) {
              perGameMap[award.gameId] = [];
            }
            perGameMap[award.gameId].push(baseAwardInfo);
          }
        }
      }

      const payload = {
        data: Array.from(winnersSet),
        expiresAt: Date.now() + TTL,
      };

      localStorage.setItem(AWARD_WINNERS_CACHE_KEY, JSON.stringify(payload));
      localStorage.setItem(
        AWARDS_PER_GAME_CACHE_KEY,
        JSON.stringify({
          data: perGameMap,
          expiresAt: Date.now() + TTL,
        })
      );

      return {
        winners: winnersSet,
        perGame: perGameMap,
      };
    } catch (e) {
      console.error("Failed to load TGA award data:", e);
      return {
        winners: new Set(),
        perGame: {},
      };
    }
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const value = useMemo(() => {
    const tagsLabels = {
      dlc: "DLC / Expansion",
      remake: "Remake",
      remaster: "Remaster",
      port: "Port / Re-release",
    };

    return {
      games,
      setGames,
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
      tagsLabels,
      getPlatformsSvg,
      isReleased,
      coverMap,
      setCoverMap,
      screenshotsMap,
      setScreenshotsMap,
      loading,
      setLoading,
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
    viewGames,
    search,
    opened,
    isLogged,
    edit,
    isModalOpen,
    featuredOpen,
    gameToEdit,
    coverMap,
    screenshotsMap,
    loading,
    gameToSee,
    itemsPerPage,
    currentPage,
    openSearch,
    timesToBeat,
    awardWinners,
    hasWonAward,
    awardsPerGame,
    showTimesDisclaimer,
    setIsAwardsModalOpen,
    isAwardsModalOpen,
    isMobile,
    setIsMobile,
  ]);

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => useContext(GameContext);