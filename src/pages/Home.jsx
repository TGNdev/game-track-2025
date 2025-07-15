import { useEffect, useRef, useState } from "react";
import { FaPlus, FaSignOutAlt } from "react-icons/fa";
import { AiFillEdit } from "react-icons/ai";
import { ToastContainer } from "react-toastify";
import GamesView from "../components/games/GamesView"
import { useGame } from "../contexts/GameContext";
import Layout from "../components/shared/Layout";
import { getGamesFromFirestore } from "../js/firebase";
import { getGameCovers, getGameScreenshots } from "../js/igdb";

const Home = () => {
  const [games, setGames] = useState([]);
  const openButtonRef = useRef(null);
  const {
    opened, setOpened,
    isLogged, logout,
    edit, setEdit,
    setIsModalOpen,
    setFeaturedOpen,
    setCoverMap,
    setScreenshotsMap,
    setLoading
  } = useGame();

  useEffect(() => {
    const fetchGames = async () => {
      try {
        setLoading(true);
        const gamesList = (await getGamesFromFirestore());
        setGames(gamesList);
      } catch (error) {
        console.error("Error fetching games:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchGames();
  }, [setLoading]);

  useEffect(() => {
    const fetchCovers = async () => {
      if (games.length === 0) return;
      const gameIds = games.map((g) => g.igdb_id);
      const covers = await getGameCovers(gameIds);
      setCoverMap(covers);
    };
    fetchCovers();
  }, [games, setCoverMap]);

  useEffect(() => {
    const fetchScreenshots = async () => {
      if (games.length === 0) return;
      const gameIds = games.map((g) => g.igdb_id);
      const screenshots = await getGameScreenshots(gameIds);
      setScreenshotsMap(screenshots);
    };
    fetchScreenshots();
  }, [games, setScreenshotsMap]);

  return (
    <Layout>
      <div className="flex flex-col items-end gap-7 sm:gap-10">
        <div className="flex flex-row justify-between min-w-full sm:px-7 mt-1">
          <div>
            <button
              type="button"
              className={`${opened ? "animate-pulse bg-amber-400" : "bg-gradient-primary"} text-sm hover:scale-110 transition text-white px-2 py-1 rounded-md sm:hidden`}
              onClick={() => {
                setOpened(prev => !prev);
                setFeaturedOpen(null);
              }}
            >
              {opened ? "Collaspe all" : "Expand all"}
            </button>
          </div>
          {isLogged ? (
            <div className="flex flex-row items-center gap-2">
              {!edit && (
                <button
                  ref={openButtonRef}
                  className="size-6 p-1 sm:text-sm sm:w-fit sm:py-2 sm:px-2.5 sm:flex flex-row items-center bg-gradient-secondary text-white rounded-md hover:scale-110 transition"
                  onClick={() => setIsModalOpen(true)}
                >
                  <FaPlus className="block sm:hidden" />
                  <div className="hidden sm:block">Add new game</div>
                </button>
              )}
              <button
                className={`${edit && "animate-pulse"} size-6 p-1 sm:text-sm sm:w-fit sm:py-2 sm:px-2.5 sm:flex flex-row items-center bg-gradient-tertiary text-white rounded-md hover:scale-110 transition`}
                onClick={(e) => {
                  e.stopPropagation();
                  setEdit(prev => !prev)
                  if (!opened && !edit) {
                    setOpened(true);
                  }
                }}
              >
                {edit ? (
                  <FaPlus className="rotate-45 block sm:hidden" />
                ) : (
                  <AiFillEdit className="block sm:hidden" />
                )}
                <div className="hidden sm:block">
                  {edit ? "Quit Edit Mode" : "Edit games"}
                </div>
              </button>
              {isLogged && (
                <button
                  onClick={logout}
                  className="size-6 p-1 sm:text-sm sm:w-fit sm:py-2 sm:px-2.5 sm:flex flex-row items-center bg-gradient-primary text-white rounded-md hover:scale-110 transition"
                >
                  <FaSignOutAlt className="block sm:hidden" />
                  <div className="hidden sm:block">Logout</div>
                </button>
              )}
            </div>
          ) : (
            <button
              ref={openButtonRef}
              className="text-sm sm:w-fit sm:py-2 px-2.5 sm:flex flex-row items-center bg-gradient-primary text-white rounded-md hover:scale-110 transition"
              onClick={() => setIsModalOpen(true)}
            >
              <div className="">I am an admin</div>
            </button>
          )}
        </div>
        <GamesView
          games={games}
          openButtonRef={openButtonRef}
        />
      </div>
      <ToastContainer position="top-right" autoClose={3000} />
    </Layout>
  );
};

export default Home;
