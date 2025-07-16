import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { auth } from "../js/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { toast } from "react-toastify";
import { ReactComponent as XboxIcon } from "../assets/icons/xbox.svg";
import { ReactComponent as PsIcon } from "../assets/icons/ps.svg";
import { ReactComponent as PcIcon } from "../assets/icons/pc.svg";
import { ReactComponent as SwitchIcon } from "../assets/icons/switch.svg";
import { ReactComponent as Switch2Icon } from "../assets/icons/switch_2.svg";

const GameContext = createContext();

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
  const [loading, setLoading] = useState(false);
  const [gameToSee, setGameToSee] = useState(null);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [openSearch, setOpenSearch] = useState(false);

  const openButtonRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLogged(!!user);
    });

    return () => unsubscribe();
  }, []);

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
    openSearch
  ]);

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => useContext(GameContext);