import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { auth } from "../js/firebase";
import { signOut } from "firebase/auth";
import { toast } from "react-toastify";
import { useAuth } from "./AuthContext";
import { ReactComponent as XboxIcon } from "../assets/icons/xbox.svg";
import { ReactComponent as PsIcon } from "../assets/icons/ps.svg";
import { ReactComponent as PcIcon } from "../assets/icons/pc.svg";
import { ReactComponent as SwitchIcon } from "../assets/icons/switch.svg";
import { ReactComponent as Switch2Icon } from "../assets/icons/switch_2.svg";

const GameUIContext = createContext(null);

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
  } catch { }
};

export const GameUIProvider = ({ children }) => {
  const [viewGames, setViewGames] = useState(true);
  const [search, setSearch] = useState("");
  const [opened, setOpened] = useState(false);
  const { currentUser, userData, loading: authLoading } = useAuth();
  const [isLogged, setIsLogged] = useState(false);
  const [edit, setEdit] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [featuredOpen, setFeaturedOpen] = useState(null);
  const [gameToEdit, setGameToEdit] = useState(null);
  const [gameToSee, setGameToSee] = useState(null);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [openSearch, setOpenSearch] = useState(false);
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
    setIsLogged(!!currentUser);
  }, [currentUser]);

  useEffect(() => {
    if (!hasWindow) return;
    const handleResize = () =>
      setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    safeLocalStorageSet(
      "showTimesDisclaimer",
      JSON.stringify(showTimesDisclaimer)
    );
  }, [showTimesDisclaimer]);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      setIsModalOpen(false);
      setEdit(false);
      toast.success("See you later !");
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

  const isComingSoon = useCallback((date) => {
    const now = new Date();
    const releaseDate = new Date(date.seconds * 1000);

    if (releaseDate <= now) return false;

    const threeMonthsLater = new Date();
    threeMonthsLater.setMonth(now.getMonth() + 3);

    return releaseDate <= threeMonthsLater;
  }, []);

  const value = useMemo(
    () => ({
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
      gameToSee,
      setGameToSee,
      itemsPerPage,
      setItemsPerPage,
      currentPage,
      setCurrentPage,
      openSearch,
      setOpenSearch,
      openButtonRef,
      showTimesDisclaimer,
      setShowTimesDisclaimer,
      isAwardsModalOpen,
      setIsAwardsModalOpen,
      isMobile,
      setIsMobile,
      currentUser,
      userData,
      logout,
      handleCloseModal,
      getPlatformsSvg,
      isReleased,
      isComingSoon,
    }),
    [
      viewGames,
      search,
      opened,
      isLogged,
      edit,
      isModalOpen,
      setIsModalOpen,
      featuredOpen,
      gameToEdit,
      gameToSee,
      itemsPerPage,
      currentPage,
      openSearch,
      showTimesDisclaimer,
      isAwardsModalOpen,
      isMobile,
      currentUser,
      userData,
      logout,
      handleCloseModal,
      getPlatformsSvg,
      isReleased,
      isComingSoon,
    ]
  );

  return (
    <GameUIContext.Provider value={value}>
      {children}
    </GameUIContext.Provider>
  );
};

export const useGameUI = () => {
  const ctx = useContext(GameUIContext);
  if (!ctx)
    throw new Error("useGameUI must be used within GameUIProvider");
  return ctx;
};
