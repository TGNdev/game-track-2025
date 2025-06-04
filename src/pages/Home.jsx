import React, { useEffect, useRef, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../js/firebase";
import { FaPlus, FaSignOutAlt } from "react-icons/fa";
import { AiFillEdit } from "react-icons/ai";
import { ToastContainer } from "react-toastify";
import GamesView from "../components/GamesView"
import EventsView from "../components/EventsView"
import { useGame } from "../components/contexts/GameContext";
import Layout from "../components/Layout";

const Home = () => {
  const [games, setGames] = useState([]);
  const [viewGames, setViewGames] = useState(true);
  const openButtonRef = useRef(null);
  const [transitioning, setTransitioning] = useState(false);
  const {
    setSearch,
    opened, setOpened,
    isLogged, logout,
    edit, setEdit,
    setIsModalOpen,
    setFeaturedOpen,
  } = useGame();

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "games"), snapshot => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setGames(list);
    })

    return () => unsub();
  }, []);

  const handleViewSwitch = (toGames) => {
    if (viewGames === toGames) return;

    setTransitioning(true);
    setTimeout(() => {
      setViewGames(toGames);
      setSearch("");
      setTransitioning(false);
    }, 300);
  };

  return (
    <Layout>
      <div className="flex flex-col items-end gap-7 sm:gap-10">
        {viewGames && (
          <div className="flex flex-row justify-between min-w-full sm:px-7 mt-1">
            <div>
              <button
                type="button"
                className={`${opened ? "animate-pulse bg-amber-400" : "bg-blue-500"} text-sm hover:scale-110 transition text-white px-2 py-1 rounded-md sm:hidden`}
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
                    className="size-6 p-1 sm:text-sm sm:w-fit sm:py-2 sm:px-2.5 sm:flex flex-row items-center bg-green-500 text-white rounded-md hover:scale-110 transition"
                    onClick={() => setIsModalOpen(true)}
                  >
                    <FaPlus className="block sm:hidden" />
                    <div className="hidden sm:block">Add new game</div>
                  </button>
                )}
                <button
                  className={`${edit && "animate-pulse"} size-6 p-1 sm:text-sm sm:w-fit sm:py-2 sm:px-2.5 sm:flex flex-row items-center bg-amber-400 text-white rounded-md hover:scale-110 transition`}
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
                    className="size-6 p-1 sm:text-sm sm:w-fit sm:py-2 sm:px-2.5 sm:flex flex-row items-center bg-blue-500 text-white rounded-md hover:scale-110 transition"
                  >
                    <FaSignOutAlt className="block sm:hidden" />
                    <div className="hidden sm:block">Logout</div>
                  </button>
                )}
              </div>
            ) : (
              <button
                ref={openButtonRef}
                className="text-sm sm:w-fit sm:py-2 px-2.5 sm:flex flex-row items-center bg-blue-500 text-white rounded-md hover:scale-110 transition"
                onClick={() => setIsModalOpen(true)}
              >
                <div className="">I am an admin</div>
              </button>
            )}
          </div>
        )}
        <div className="w-full flex justify-center">
          <div className="flex flex-row w-full gap-4 items-center justify-center">
            <button
              className={`${viewGames && "bg-blue-500 text-white"} disabled:opacity-80 disabled:hover:bg-blue-500 hover:bg-slate-200 w-fit px-2 py-1.5 sm:px-3 sm:py-2 border rounded-md text-sm sm:text-base transition`}
              onClick={() => handleViewSwitch(true)}
              disabled={viewGames}
            >
              Games
            </button>
            <button
              className={`${!viewGames && "bg-blue-500 text-white"} disabled:opacity-80 disabled:hover:bg-blue-500 hover:bg-slate-200 w-fit px-2 py-1.5 sm:px-3 sm:py-2 border rounded-md text-sm sm:text-base transition`}
              onClick={() => handleViewSwitch(false)}
              disabled={!viewGames}
            >
              Events
            </button>
          </div>
        </div>
        <div className={`transition-opacity duration-300 ${transitioning ? "opacity-0" : "opacity-100"} w-full`}>
          {viewGames ? (
            <GamesView games={games} openButtonRef={openButtonRef} />
          ) : (
            <EventsView />
          )}
        </div>
        <ToastContainer position="top-right" autoClose={3000} />
      </div>
    </Layout>
  );
};

export default Home;
