import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Search from "./Search";
import { useGame } from "../../contexts/GameContext";
import { FaPlus, FaSignOutAlt } from "react-icons/fa";
import { AiFillEdit } from "react-icons/ai";
import { FiMenu } from "react-icons/fi";

const Header = ({ onDrawerOpen }) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY || window.pageYOffset;
      setIsScrolled(scrollPosition > 10);
    };

    window.addEventListener("scroll", handleScroll);
    // Check initial scroll position
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);
  const {
    opened, setOpened,
    setFeaturedOpen,
    isLogged,
    logout,
    edit, setEdit,
    openButtonRef,
    setIsModalOpen
  } = useGame();
  const allowedSearchRoutes = ["/", "/leaks-rumours", "/hall-of-fame", "/game-track-2025"];
  const allowedContolsRoutes = ["/", "/game-track-2025"];
  const currentPath = window.location.hash
    ? window.location.hash.replace(/^#/, "")
    : window.location.pathname;
  let canSearch = true;
  let viewControls = false;

  if (!allowedSearchRoutes.includes(currentPath)) {
    canSearch = false;
  }

  if (allowedContolsRoutes.includes(currentPath)) {
    viewControls = true;
  }

  return (
    <div className={`sticky top-0 z-30 isolation-isolate flex flex-col items-start justify-between w-full gap-6 py-4 px-6 transition-all duration-300 ${isScrolled ? "backdrop-blur-md shadow-md" : ""}`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full">
        <Link to="/">
          <div className="flex flex-row gap-2 items-center">
            <img src="logo.png" alt="Game Track Logo" className="size-6" />
            <h1 className="text-xl font-bold text-white">{process.env.REACT_APP_TITLE}</h1>
          </div>
        </Link>
        <div className="flex flex-row w-full sm:w-2/3 justify-end gap-5">
          {canSearch && <Search />}
          <button
            onClick={onDrawerOpen}
            className="w-10 h-10 min-w-[40px] min-h-[40px] shrink-0 flex items-center justify-center bg-gradient-primary rounded-full shadow-md transition duration-150 ease-in-out top-4 right-4 sm:right-4 z-50 sm:static fixed"
            aria-label="Open navigation drawer"
          >
            <FiMenu className="size-5 text-white" />
          </button>
        </div>
      </div>

      {viewControls && (
        <div className="flex flex-row justify-between w-full">
          <div>
            <button
              type="button"
              className={`${opened ? "animate-pulse bg-gradient-tertiary" : "bg-gradient-primary"} text-sm hover:scale-110 transition text-white px-2 py-1 rounded-md sm:hidden`}
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
      )}
    </div>
  );
}

export default Header;