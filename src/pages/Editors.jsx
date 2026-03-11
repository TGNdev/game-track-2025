import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useGameData } from "../contexts/GameDataContext";
import Layout from "../components/shared/Layout";
import { motion, AnimatePresence } from "framer-motion";
import { FaBuilding, FaGlobe, FaCity } from "react-icons/fa";
import { FiSearch } from "react-icons/fi";
import he from "he";

const Editors = () => {
  const { editors, loadingEditors, ensureEditorsLoaded } = useGameData();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLetter, setSelectedLetter] = useState("A");

  useEffect(() => {
    ensureEditorsLoaded();
  }, [ensureEditorsLoaded]);

  const alphabet = useMemo(() => {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    const availableCategories = [...new Set(
      editors
        .filter(dev => dev.name && dev.name.length > 0)
        .map(dev => {
          const firstChar = dev.name[0].toUpperCase();
          return /\d/.test(firstChar) ? "#" : firstChar;
        })
    )];

    const alphaItems = letters.map(char => ({
      char,
      hasDevs: availableCategories.includes(char)
    }));

    return [
      { char: "#", hasDevs: availableCategories.includes("#") },
      ...alphaItems
    ];
  }, [editors]);

  useEffect(() => {
    if (editors.length > 0 && !searchQuery) {
      const currentAvailableLetters = alphabet.filter(l => l.hasDevs).map(l => l.char);
      if (currentAvailableLetters.length > 0 && !currentAvailableLetters.includes(selectedLetter)) {
        setSelectedLetter(currentAvailableLetters.includes("A") ? "A" : currentAvailableLetters[0]);
      }
    }
  }, [editors, searchQuery, selectedLetter, alphabet]);

  const filteredEditors = useMemo(() => {
    const query = searchQuery.toLowerCase();
    let list = editors;

    if (query) {
      list = list.filter(dev => dev.name.toLowerCase().includes(query));
    } else if (selectedLetter) {
      if (selectedLetter === "#") {
        list = list.filter(dev => /\d/.test(dev.name[0]));
      } else {
        list = list.filter(dev => dev.name[0].toUpperCase() === selectedLetter);
      }
    }

    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [editors, searchQuery, selectedLetter]);

  if (loadingEditors) {
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
      <div className="mx-auto max-w-7xl px-6 py-10">
        <header className="mb-12">
          <h1 className="text-5xl font-black bg-clip-text text-white mb-4">
            The Industry
          </h1>
          <p className="text-white/40 font-bold uppercase tracking-widest text-sm max-w-2xl">
            Discover the editors behind your favorite games. Browse by name or search for a specific entity.
          </p>
        </header>

        <div className="flex flex-col gap-8 mb-12">
          <div className="relative group">
            <FiSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-colors text-xl" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search editors..."
              className="w-full bg-white/5 border border-white/10 rounded-[2rem] pl-16 pr-8 py-6 focus:outline-none focus:border-white/20 font-bold text-lg backdrop-blur-md"
            />
          </div>

          <div className="flex flex-wrap justify-center gap-1 md:gap-2">
            {alphabet.map(({ char, hasDevs }) => (
              <button
                key={char}
                onClick={() => hasDevs && setSelectedLetter(char)}
                disabled={!hasDevs}
                className={`size-8 md:size-10 rounded-xl flex items-center justify-center font-black transition-all ${hasDevs
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
            {filteredEditors.length} of {editors.length} results
          </p>
        </div>
        {filteredEditors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredEditors.map((dev, index) => (
                <motion.div
                  key={dev.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.02 }}
                >
                  <Link
                    to={`/developers/${dev.id}`}
                    className="block bg-white/5 border border-white/10 rounded-3xl p-6 hover:border-white/20 hover:bg-white/10 transition-all h-full group"
                  >
                    <div className="flex items-center gap-6 mb-4">
                      <div className="size-20 bg-white/5 rounded-2xl p-4 flex items-center justify-center overflow-hidden border border-white/5">
                        {dev.logo ? (
                          <img src={dev.logo} alt={dev.name} className="w-full h-full object-contain" />
                        ) : (
                          <FaBuilding className="text-white/10 text-2xl" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-xl font-black group-hover:text-white transition-colors">{he.decode(dev.name)}</h3>
                        <div className="flex items-center gap-2 text-white/40 text-xs font-bold uppercase mt-1">
                          <FaGlobe className="text-white opacity-50 font-bold" />
                          {dev.country}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      {dev.city && (
                        <div className="flex items-center gap-2 text-white/30 text-xs">
                          <FaCity />
                          <span className="font-bold">{dev.city}</span>
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

export default Editors;
