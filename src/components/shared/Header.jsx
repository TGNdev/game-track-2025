import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Search from "./Search";
import { FaPlus } from "react-icons/fa";
import { AiFillEdit } from "react-icons/ai";
import { FiMenu } from "react-icons/fi";
import { useGameUI } from "../../contexts/GameUIContext";
import { useAuth } from "../../contexts/AuthContext";

const Header = ({ onDrawerOpen }) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY || window.pageYOffset;
      setIsScrolled(scrollPosition > 10);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const {
    opened, setOpened,
    setFeaturedOpen,
    isLogged,
    edit, setEdit,
    openButtonRef,
    setIsModalOpen,
    isMobile,
  } = useGameUI();
  const { userData } = useAuth();

  const allowedSearchRoutes = ["/", "/leaks-rumours", "/hall-of-fame", "/game-track-2025"];
  const allowedContolsRoutes = ["/", "/game-track-2025"];
  const currentPath = window.location.hash
    ? window.location.hash.replace(/^#/, "")
    : window.location.pathname;

  let canSearch = allowedSearchRoutes.includes(currentPath) || currentPath.startsWith("/profiles/");
  let viewControls = allowedContolsRoutes.includes(currentPath) || currentPath.startsWith("/admin/");

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
            {isMobile && (
              <button
                type="button"
                className={`${opened ? "animate-pulse bg-gradient-tertiary" : "bg-gradient-primary"} text-sm px-2 py-1 rounded-md`}
                onClick={() => {
                  setOpened(prev => !prev);
                  setFeaturedOpen(null);
                }}
              >
                {opened ? "Collaspe all" : "Expand all"}
              </button>
            )}
          </div>
          {isLogged && (
            <div className="flex flex-row items-center gap-2">
              {userData?.isAdmin && !edit && (
                <button
                  ref={openButtonRef}
                  className="size-6 p-1 sm:text-sm sm:w-fit sm:py-2 sm:px-2.5 sm:flex flex-row items-center bg-gradient-secondary rounded-md"
                  onClick={() => setIsModalOpen(true)}
                >
                  <FaPlus className="block sm:hidden" />
                  <div className="hidden sm:block">Add new game</div>
                </button>
              )}
              {userData?.isAdmin && (
                <button
                  className={`${edit && "animate-pulse"} size-6 p-1 sm:text-sm sm:w-fit sm:py-2 sm:px-2.5 sm:flex flex-row items-center bg-gradient-tertiary rounded-md`}
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
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Header;