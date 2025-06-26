import { useState } from "react";
import { motion } from "framer-motion";
import { useGame } from "../../contexts/GameContext";
import { FiX } from "react-icons/fi";
import { FaMagnifyingGlass } from "react-icons/fa6";

const Search = () => {
  const [open, setOpen] = useState(false);
  const {
    search, setSearch,
  } = useGame();

  return (
    <>
      {!open ? (
        <button
          className="w-10 h-10 min-w-[40px] min-h-[40px] shrink-0 flex items-center justify-center bg-white rounded-full shadow-md hover:shadow-lg hover:bg-gray-100 transition duration-150 ease-in-out top-4 right-16 sm:right-4 z-50 sm:static fixed"
          onClick={() => setOpen(true)}
          aria-label="Open search"
        >
          <FaMagnifyingGlass className="size-4" />
        </button>
      ) : (
        <>
          <button
            className="w-10 h-10 min-w-[40px] min-h-[40px] shrink-0 flex items-center justify-center bg-white rounded-full shadow-md hover:shadow-lg hover:bg-gray-100 transition duration-150 ease-in-out fixed top-4 right-16 sm:right-4 z-50 sm:static"
            onClick={() => {
              setOpen(false);
              setSearch("");
            }}
            aria-label="Close search"
          >
            <FiX size={20} />
          </button>
          <motion.input
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            exit={{ width: 0 }}
            transition={{
              duration: 0.3,
              ease: [0.4, 0, 0.2, 1]
            }}
            className="px-3 py-2 rounded-lg border w-full focus:shadow-lg focus:outline-none transition"
            type="text"
            placeholder="Type to search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />
        </>
      )}
    </>
  );
};

export default Search;