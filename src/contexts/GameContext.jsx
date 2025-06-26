import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../js/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { toast } from "react-toastify";

const GameContext = createContext();

export const GameProvider = ({ children }) => {
  const [viewGames, setViewGames] = useState(true);
  const [search, setSearch] = useState("");
  const [opened, setOpened] = useState(false);
  const [isLogged, setIsLogged] = useState(false);
  const [edit, setEdit] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [featuredOpen, setFeaturedOpen] = useState(null);
  const [gameToEdit, setGameToEdit] = useState(null);

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

  function highlightMatch(text, query) {
    if (!query) return text;

    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <span key={i} className="bg-yellow-200 font-semibold rounded">
          {part}
        </span>
      ) : (
        part
      )
    );
  }

  return (
    <GameContext.Provider
      value={{
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
        highlightMatch,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => useContext(GameContext);
