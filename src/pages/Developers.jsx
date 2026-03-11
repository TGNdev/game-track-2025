import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useGameData } from "../contexts/GameDataContext";
import Layout from "../components/shared/Layout";
import { motion, AnimatePresence } from "framer-motion";
import { FaBuilding, FaGlobe, FaCity } from "react-icons/fa";
import { FiSearch } from "react-icons/fi";
import he from "he";

const Developers = () => {
  const location = useLocation();
  const { developers, loadingDevelopers, ensureDevelopersLoaded, editors, loadingEditors, ensureEditorsLoaded } = useGameData();

  // Set initial view mode based on path, default to developers
  const [viewMode, setViewMode] = useState(() => {
    if (location.pathname.includes("editors")) return "editors";
    return "developers";
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLetter, setSelectedLetter] = useState("A");

  // Sync viewMode if location changes
  useEffect(() => {
    if (location.pathname.includes("editors")) {
      setViewMode("editors");
    } else if (location.pathname.includes("developers")) {
      setViewMode("developers");
    }
  }, [location.pathname]);

  useEffect(() => {
    ensureDevelopersLoaded();
    ensureEditorsLoaded();
  }, [ensureDevelopersLoaded, ensureEditorsLoaded]);

  const currentItems = useMemo(() => {
    return viewMode === "developers" ? developers : editors;
  }, [viewMode, developers, editors]);

  const alphabet = useMemo(() => {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    const availableCategories = [...new Set(
      currentItems
        .filter(item => item.name && item.name.length > 0)
        .map(item => {
          const firstChar = item.name[0].toUpperCase();
          return /\d/.test(firstChar) ? "#" : firstChar;
        })
    )];

    const alphaItems = letters.map(char => ({
      char,
      hasItems: availableCategories.includes(char)
    }));

    return [
      { char: "#", hasItems: availableCategories.includes("#") },
      ...alphaItems
    ];
  }, [currentItems]);

  useEffect(() => {
    if (currentItems.length > 0 && !searchQuery) {
      const currentAvailableLetters = alphabet.filter(l => l.hasItems).map(l => l.char);
      if (currentAvailableLetters.length > 0 && !currentAvailableLetters.includes(selectedLetter)) {
        setSelectedLetter(currentAvailableLetters.includes("A") ? "A" : currentAvailableLetters[0]);
      }
    }
  }, [currentItems, searchQuery, selectedLetter, alphabet]);

  const filteredItems = useMemo(() => {
    const query = searchQuery.toLowerCase();
    let list = currentItems;

    if (query) {
      list = list.filter(item => item.name.toLowerCase().includes(query));
    } else if (selectedLetter) {
      if (selectedLetter === "#") {
        list = list.filter(item => /\d/.test(item.name[0]));
      } else {
        list = list.filter(item => item.name[0].toUpperCase() === selectedLetter);
      }
    }

    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [currentItems, searchQuery, selectedLetter]);

  if (loadingDevelopers || loadingEditors) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-[1400px] mx-auto px-6 pb-12 md:py-20 space-y-12">
        <header>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
                The Industry
              </h1>
              <p className="text-white/40 font-medium max-w-xl text-lg leading-relaxed">
                Discover the studios and publishers behind your favorite games. Browse by name or search for a specific entity.
              </p>
            </div>
          </div>
        </header>

        <div className="w-full flex justify-center">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-1.5 shadow-2xl flex items-center gap-1">
            <button
              className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${viewMode === "developers"
                ? "bg-gradient-primary text-white shadow-lg shadow-primary/20"
                : "text-white/40 hover:text-white hover:bg-white/5"
                }`}
              onClick={() => {
                setViewMode("developers");
                setSearchQuery("");
              }}
            >
              Developers
            </button>
            <button
              className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${viewMode === "editors"
                ? "bg-gradient-primary text-white shadow-lg shadow-primary/20"
                : "text-white/40 hover:text-white hover:bg-white/5"
                }`}
              onClick={() => {
                setViewMode("editors");
                setSearchQuery("");
              }}
            >
              Editors
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-8 mb-12">
          <div className="relative group">
            <FiSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-colors text-xl" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${viewMode}...`}
              className="w-full bg-white/5 border border-white/10 rounded-[2rem] pl-16 pr-8 py-6 focus:outline-none focus:border-white/20 font-bold text-lg backdrop-blur-md"
            />
          </div>

          <div className="flex flex-wrap justify-center gap-1 md:gap-2">
            {alphabet.map(({ char, hasItems }) => (
              <button
                key={char}
                onClick={() => hasItems && setSelectedLetter(char)}
                disabled={!hasItems}
                className={`size-8 md:size-10 rounded-xl flex items-center justify-center font-black transition-all ${hasItems
                  ? selectedLetter === char && !searchQuery.trim()
                    ? "bg-white/5 text-white shadow-lg scale-110"
                    : "bg-white/5 hover:bg-white/10 hover:text-white cursor-pointer"
                  : "opacity-10 cursor-not-allowed"
                  }`}
              >
                {char}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <p className="text-white/40 font-bold uppercase tracking-widest text-sm">
            {filteredItems.length} of {currentItems.length} results
          </p>
        </div>

        {filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  layout
                >
                  <Link
                    to={`/industry/${item.id}`}
                    className="block bg-white/5 border border-white/10 rounded-3xl p-6 hover:border-white/20 hover:bg-white/10 transition-all h-full group"
                  >
                    <div className="flex items-center gap-6 mb-4">
                      <div className="size-20 bg-white/5 rounded-2xl p-4 flex items-center justify-center overflow-hidden border border-white/5">
                        {item.logo ? (
                          <img src={item.logo} alt={item.name} className="w-full h-full object-contain" />
                        ) : (
                          <FaBuilding className="text-white/10 text-2xl" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-xl font-black group-hover:text-white transition-colors">{he.decode(item.name)}</h3>
                        <div className="flex items-center gap-2 text-white/40 text-xs font-bold uppercase mt-1">
                          <FaGlobe className="text-white opacity-50 font-bold" />
                          {item.country || "Unknown"}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      {item.city && (
                        <div className="flex items-center gap-2 text-white/30 text-xs">
                          <FaCity />
                          <span className="font-bold">{item.city}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                      <span className="text-white/20">View Details</span>
                      <span className="text-white group-hover:translate-x-1 transition-transform">→</span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-center py-20 bg-white/5 rounded-[3rem] border border-dashed border-white/10">
            <p className="text-white/40 text-xl font-bold italic">No results found.</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Developers;
