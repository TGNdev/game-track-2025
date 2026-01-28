import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useGameData } from "../contexts/GameDataContext";
import Layout from "../components/shared/Layout";
import { Navigate } from "react-router-dom";
import { getTgaFromFirestore, saveTgaYear } from "../js/firebase";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { FaPlus, FaTrash, FaSave, FaTrophy, FaStar, FaUser, FaMask } from "react-icons/fa";
import { FiX, FiImage } from "react-icons/fi";
import { matchesSearch } from "../js/utils";

const AdminTga = () => {
  const { userData, loading: authLoading } = useAuth();
  const { games, loadingGames, refreshTgaData } = useGameData();
  const [tgaYears, setTgaYears] = useState([]);
  const [selectedYearDoc, setSelectedYearDoc] = useState(null);
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(0);

  // Form State
  const [yearInput, setYearInput] = useState(new Date().getFullYear());
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchTga = async () => {
      try {
        const data = await getTgaFromFirestore();
        setTgaYears(data.sort((a, b) => b.year - a.year));
      } catch (err) {
        toast.error("Failed to load TGA data");
      }
    };
    fetchTga();

    // Load persisted state from sessionStorage
    const savedState = sessionStorage.getItem("tga_admin_state");
    if (savedState) {
      try {
        const { selectedYearDoc: savedDoc, yearInput: savedYear, categories: savedCats, activeCategoryIndex: savedIdx } = JSON.parse(savedState);
        if (savedDoc) setSelectedYearDoc(savedDoc);
        if (savedYear) setYearInput(savedYear);
        if (savedCats) setCategories(savedCats);
        if (savedIdx !== undefined) setActiveCategoryIndex(savedIdx);
        toast.info("Restored your previous unsaved session", { autoClose: 3000 });
      } catch (e) {
        console.error("Failed to restore TGA state", e);
      }
    }
  }, []);

  // Save state to sessionStorage whenever it changes
  useEffect(() => {
    if (selectedYearDoc) {
      const stateToSave = {
        selectedYearDoc,
        yearInput,
        categories,
        activeCategoryIndex
      };
      sessionStorage.setItem("tga_admin_state", JSON.stringify(stateToSave));
    }
  }, [selectedYearDoc, yearInput, categories, activeCategoryIndex]);

  const clearPersistence = () => {
    sessionStorage.removeItem("tga_admin_state");
  };

  const handleEditYear = (tga) => {
    setSelectedYearDoc(tga);
    setYearInput(tga.year);
    setCategories(tga.awards || []);
    setActiveCategoryIndex(0);
  };

  const handleCreateNew = () => {
    clearPersistence();
    setSelectedYearDoc({ id: "new" });
    setYearInput(new Date().getFullYear());
    setCategories([{ title: "Game of the Year", nominees: [] }]);
    setActiveCategoryIndex(0);
  };

  const addCategory = () => {
    const newCategories = [...categories, { title: "New Category", nominees: [] }];
    setCategories(newCategories);
    setActiveCategoryIndex(newCategories.length - 1);
  };

  const removeCategory = (index) => {
    const newCategories = categories.filter((_, i) => i !== index);
    setCategories(newCategories);
    if (activeCategoryIndex >= newCategories.length) {
      setActiveCategoryIndex(Math.max(0, newCategories.length - 1));
    }
  };

  const updateCategoryTitle = (index, title) => {
    const newCategories = [...categories];
    newCategories[index].title = title;
    setCategories(newCategories);
  };

  const addNominee = (catIndex) => {
    const newCategories = [...categories];
    const categoryType = detectCategoryType(newCategories[catIndex].title);

    const newNominee = { gameId: "", isWinner: false };
    if (categoryType === "performance") {
      newNominee.role = {
        actor: { name: "", image: "" },
        as: { name: "", image: "" }
      };
    }

    newCategories[catIndex].nominees.push(newNominee);
    setCategories(newCategories);
  };

  const updateNominee = (catIndex, nomineeIndex, field, value) => {
    const newCategories = [...categories];
    const nominee = newCategories[catIndex].nominees[nomineeIndex];

    if (field.includes(".")) {
      // Handle nested fields like role.actor.name
      const keys = field.split(".");
      let current = nominee;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
    } else {
      nominee[field] = value;
    }

    if (field === "isWinner" && value === true) {
      newCategories[catIndex].nominees.forEach((nom, i) => {
        if (i !== nomineeIndex) nom.isWinner = false;
      });
    }

    setCategories(newCategories);
  };

  const removeNominee = (catIndex, nomineeIndex) => {
    const newCategories = [...categories];
    newCategories[catIndex].nominees = newCategories[catIndex].nominees.filter((_, i) => i !== nomineeIndex);
    setCategories(newCategories);
  };

  const handleSave = async () => {
    if (!yearInput) {
      toast.error("Please enter a year");
      return;
    }

    const yearData = {
      year: parseInt(yearInput),
      awards: categories
    };

    try {
      const docId = selectedYearDoc.id === "new" ? null : selectedYearDoc.id;
      await saveTgaYear(yearData, docId);
      await refreshTgaData();
      toast.success("TGA data saved successfully!");
      clearPersistence();
      const data = await getTgaFromFirestore();
      setTgaYears(data.sort((a, b) => b.year - a.year));
      setSelectedYearDoc(null);
    } catch (err) {
      toast.error("Failed to save TGA data");
    }
  };

  if (authLoading || loadingGames) return (
    <Layout>
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    </Layout>
  );

  if (!userData?.isAdmin) return <Navigate to="/" />;

  return (
    <Layout>
      <div className="mx-auto max-w-7xl px-6 py-10">
        <header className="mb-10 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
              TGA Administrator
            </h1>
            <p className="text-white/40 font-bold uppercase tracking-widest text-sm mt-2">
              Manage awards, categories, and nominees
            </p>
          </div>
          {!selectedYearDoc ? (
            <button
              onClick={handleCreateNew}
              className="flex items-center gap-2 bg-gradient-primary px-6 py-3 rounded-2xl font-bold shadow-xl hover:scale-105 transition-transform"
            >
              <FaPlus /> Create New Year
            </button>
          ) : (
            <button
              onClick={() => {
                setSelectedYearDoc(null);
                clearPersistence();
              }}
              className="flex items-center gap-2 bg-white/10 px-6 py-3 rounded-2xl font-bold hover:bg-white/20 transition-colors"
            >
              <FiX /> Cancel
            </button>
          )}
        </header>

        {!selectedYearDoc ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tgaYears.map((tga) => (
              <motion.div
                key={tga.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-sm hover:border-white/20 transition-all group"
              >
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-3xl font-black">{tga.year}</h2>
                  <div className="bg-gradient-tertiary p-2 rounded-xl">
                    <FaTrophy className="text-white" />
                  </div>
                </div>
                <p className="text-white/60 mb-6 font-medium">
                  {tga.awards?.length || 0} Categories
                </p>
                <button
                  onClick={() => handleEditYear(tga)}
                  className="w-full bg-white/10 py-3 rounded-2xl font-bold group-hover:bg-gradient-primary transition-all duration-300"
                >
                  Edit Data
                </button>
                <div className="mt-2 text-[10px] text-white/20 font-mono text-center truncate">
                  ID: {tga.id}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md">
              <div className="flex flex-col md:flex-row md:items-end gap-6">
                <div className="flex-1">
                  <label className="block text-xs font-black uppercase tracking-widest text-white/40 mb-3">
                    Award Year
                  </label>
                  <input
                    type="number"
                    value={yearInput}
                    onChange={(e) => setYearInput(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-white/30 text-xl font-bold"
                    placeholder="e.g. 2024"
                  />
                </div>
                <button
                  onClick={handleSave}
                  className="flex items-center justify-center gap-3 bg-gradient-secondary px-10 py-4 rounded-2xl font-black text-lg shadow-2xl hover:scale-105 transition-transform"
                >
                  <FaSave /> Save TGA {yearInput}
                </button>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-3xl backdrop-blur-md min-h-[600px] flex flex-col relative">
              <div className="bg-white/5 border-b border-white/10 p-2 flex items-center gap-2 overflow-x-auto scrollbar-hide">
                {categories.map((cat, idx) => (
                  <div key={idx} className="flex items-center group relative">
                    <button
                      onClick={() => setActiveCategoryIndex(idx)}
                      className={`px-6 py-3 rounded-xl font-bold whitespace-nowrap transition-all ${activeCategoryIndex === idx
                        ? "bg-gradient-primary shadow-lg scale-100"
                        : "text-white/40 hover:text-white hover:bg-white/5 scale-95"
                        }`}
                    >
                      {cat.title || "Untitled Category"}
                    </button>
                    {categories.length > 1 && (
                      <button
                        onClick={() => removeCategory(idx)}
                        className="absolute -top-1 -right-1 z-10 bg-red-500 hover:bg-red-400 p-1 rounded-full text-[10px] opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                      >
                        <FiX />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={addCategory}
                  className="p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors ml-4"
                  title="Add Category"
                >
                  <FaPlus />
                </button>
              </div>

              <div className="p-8 flex-1">
                {categories[activeCategoryIndex] && (
                  <motion.div
                    key={activeCategoryIndex}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-8"
                  >
                    <div className="flex flex-col md:flex-row gap-6 items-end">
                      <div className="flex-1">
                        <label className="block text-xs font-black uppercase tracking-widest text-white/40 mb-3">
                          Category Name
                        </label>
                        <input
                          type="text"
                          value={categories[activeCategoryIndex].title}
                          onChange={(e) => updateCategoryTitle(activeCategoryIndex, e.target.value)}
                          className="w-full bg-black/20 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-white/30 text-xl font-bold"
                          placeholder="e.g. Game of the Year"
                        />
                      </div>
                      <button
                        onClick={() => removeCategory(activeCategoryIndex)}
                        className="bg-red-500/20 hover:bg-red-500/40 text-red-500 px-6 py-4 rounded-2xl font-bold flex items-center gap-2 transition-colors border border-red-500/30"
                      >
                        <FaTrash /> Remove Category
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <h3 className="text-xl font-black">Nominees</h3>
                          {detectCategoryType(categories[activeCategoryIndex].title) !== "standard" && (
                            <span className="bg-gradient-tertiary/20 text-[#ff9e43] text-[10px] font-black uppercase px-2 py-1 rounded-lg border border-[#ff9e43]/30">
                              {detectCategoryType(categories[activeCategoryIndex].title)} mode
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => addNominee(activeCategoryIndex)}
                          className="flex items-center gap-2 text-sm bg-gradient-primary px-4 py-2 rounded-xl font-bold"
                        >
                          <FaPlus size={12} /> Add Nominee
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        {categories[activeCategoryIndex].nominees.map((nom, nIdx) => (
                          <NomineeRow
                            key={nIdx}
                            nominee={nom}
                            categoryType={detectCategoryType(categories[activeCategoryIndex].title)}
                            games={games}
                            onUpdate={(field, val) => updateNominee(activeCategoryIndex, nIdx, field, val)}
                            onRemove={() => removeNominee(activeCategoryIndex, nIdx)}
                          />
                        ))}
                        {categories[activeCategoryIndex].nominees.length === 0 && (
                          <div className="text-center py-10 bg-white/5 rounded-3xl border border-dashed border-white/20">
                            <p className="text-white/40 font-medium italic">No nominees added yet.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

const detectCategoryType = (title) => {
  const t = title.toLowerCase();
  if (t.includes("performance")) return "performance";
  if (t.includes("voice") || t.includes("choice")) return "playersVoice";
  return "standard";
};

const NomineeRow = ({ nominee, categoryType, games, onUpdate, onRemove }) => {
  const [showGames, setShowGames] = useState(false);
  const [search, setSearch] = useState("");

  const filteredGames = useMemo(() => {
    if (!search) return games.slice(0, 10);
    return games
      .sort((a, b) => matchesSearch(b.name, search) - matchesSearch(a.name, search))
      .filter(g => matchesSearch(g.name, search))
      .slice(0, 10);
  }, [games, search]);

  const selectedGame = games.find(g => g.id === nominee.gameId);

  return (
    <div className={`flex flex-col gap-4 p-6 rounded-2xl border transition-all ${showGames ? 'z-50 relative' : 'z-auto'} ${nominee.isWinner ? 'bg-gradient-tertiary/20 border-[#ff9e43]/50 shadow-[0_0_20px_rgba(255,158,67,0.1)]' : 'bg-white/5 border-white/10'}`}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full items-start">

        {/* 1. Linked Game Section (Primary for all) */}
        <div className="lg:col-span-4 relative">
          <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Linked Game</label>
          <div
            onClick={() => setShowGames(!showGames)}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 cursor-pointer text-sm font-bold flex items-center justify-between group hover:border-white/30 transition-all"
          >
            <span className={nominee.gameId ? "text-white" : "text-white/20"}>
              {selectedGame ? selectedGame.name : "Select a game..."}
            </span>
            <FaStar className={`size-3 transition-colors ${nominee.gameId ? 'text-[#ff9e43]' : 'text-white/10'}`} />
          </div>

          <AnimatePresence>
            {showGames && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute z-50 top-full left-0 right-0 mt-2 bg-slate-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden"
              >
                <div className="p-2 border-b border-white/10">
                  <input
                    autoFocus
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search game..."
                    className="w-full bg-white/5 rounded-lg px-3 py-2 text-xs focus:outline-none"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <div className="max-h-48 overflow-y-auto custom-scrollbar">
                  {filteredGames.map(g => (
                    <div
                      key={g.id}
                      onClick={() => {
                        onUpdate("gameId", g.id);
                        setShowGames(false);
                      }}
                      className="px-4 py-2 hover:bg-white/10 cursor-pointer text-xs font-medium border-b border-white/5 last:border-none flex items-center justify-between"
                    >
                      <span>{g.name}</span>
                      <span className="text-[10px] opacity-40 uppercase">{g.developers?.[0]?.name}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 2. Performance Fields (Only if in Performance mode) */}
        {categoryType === "performance" && (
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">
                  <FaUser size={10} /> Actor Name
                </label>
                <input
                  type="text"
                  value={nominee.role?.actor?.name || ""}
                  onChange={(e) => onUpdate("role.actor.name", e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-sm font-bold focus:border-[#5a8eff]/50 transition-all outline-none"
                  placeholder="e.g. Christopher Judge"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">
                  <FiImage size={10} /> Actor Image URL
                </label>
                <input
                  type="text"
                  value={nominee.role?.actor?.image || ""}
                  onChange={(e) => onUpdate("role.actor.image", e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-sm font-bold focus:border-[#5a8eff]/50 transition-all outline-none"
                  placeholder="https://..."
                />
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">
                  <FaMask size={10} /> Character Name
                </label>
                <input
                  type="text"
                  value={nominee.role?.as?.name || ""}
                  onChange={(e) => onUpdate("role.as.name", e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-sm font-bold focus:border-[#b069ff]/50 transition-all outline-none"
                  placeholder="e.g. Kratos"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">
                  <FiImage size={10} /> Character Image URL
                </label>
                <input
                  type="text"
                  value={nominee.role?.as?.image || ""}
                  onChange={(e) => onUpdate("role.as.image", e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-sm font-bold focus:border-[#b069ff]/50 transition-all outline-none"
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>
        )}

        {/* 3. Status Section (Winner/Remove) */}
        <div className={`flex items-center gap-3 shrink-0 ${categoryType === "performance" ? "lg:col-span-12 justify-end pt-4 border-t border-white/5" : "lg:col-span-8 justify-end self-end"}`}>
          <label className={`flex items-center gap-2 cursor-pointer px-6 py-3 rounded-xl border transition-all ${nominee.isWinner ? 'bg-[#ff9e43] text-black border-transparent shadow-[0_0_15px_rgba(255,158,67,0.4)]' : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20'}`}>
            <input
              type="checkbox"
              checked={nominee.isWinner}
              onChange={(e) => onUpdate("isWinner", e.target.checked)}
              className="hidden"
            />
            <FaTrophy className={nominee.isWinner ? "text-black animate-bounce" : "text-white/20"} />
            <span className="text-xs font-black uppercase tracking-wider">Winner</span>
          </label>

          <button
            onClick={onRemove}
            className="p-3 text-white/20 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
            title="Remove Nominee"
          >
            <FaTrash size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminTga;
