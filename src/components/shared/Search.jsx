import { AnimatePresence, motion } from "framer-motion";
import { useGame } from "../../contexts/GameContext";
import { FiX } from "react-icons/fi";
import { FaMagnifyingGlass } from "react-icons/fa6";

const Search = () => {
  const {
    search, setSearch,
    openSearch, setOpenSearch
  } = useGame();

  return (
    <>
      {!openSearch ? (
        <button
          className="w-10 h-10 min-w-[40px] min-h-[40px] shrink-0 flex items-center justify-center bg-gradient-primary rounded-full shadow-md duration-150 ease-in-out top-4 right-16 sm:right-4 z-50 sm:static fixed"
          onClick={() => setOpenSearch(true)}
          aria-label="Open search"
        >
          <FaMagnifyingGlass className="size-4" />
        </button>
      ) : (
        <button
          className="w-10 h-10 min-w-[40px] min-h-[40px] shrink-0 flex items-center justify-center bg-gradient-primary rounded-full shadow-md duration-150 ease-in-out fixed top-4 right-16 sm:right-4 sm:static"
          onClick={() => {
            setOpenSearch(false);
            setSearch("");
          }}
          aria-label="Close search"
        >
          <FiX size={20} />
        </button>
      )}
      <AnimatePresence>
        {openSearch && (
          <motion.div
            key="search-input"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: "100%", opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="rounded-full w-full h-10 mt-4 sm:mt-0 border-primary"
          >
            <input
              className="px-4 bg-transparent h-full w-full focus:outline-none"
              type="text"
              placeholder="Search a game's name, developper(s) or editor(s)"
              value={search}
              name="search"
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Search;
