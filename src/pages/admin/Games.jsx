import { useState, useEffect, useMemo, memo } from "react";
import Layout from "../../components/shared/Layout";
import { FaGamepad, FaPlus, FaTrash, FaSave, FaEdit, FaDesktop, FaChartBar, FaStar, FaHammer } from "react-icons/fa";
import { FiX, FiSearch, FiChevronLeft, FiChevronRight, FiPlusCircle } from "react-icons/fi";
import { useAuth } from "../../contexts/AuthContext";
import { useGameData } from "../../contexts/GameDataContext";
import { Navigate } from "react-router-dom";
import { addGameToFirestore, editGameFromFirestore, deleteGameFromFirestore } from "../../js/firebase";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import he from "he";
import SmartCover from "../../components/shared/SmartCover";
import SuggestionDropdown from "../../components/modals/SuggestionDropdown";
import QuickDeveloperModal from "../../components/modals/QuickDeveloperModal";
import { PLATFORMS, TAGS } from "../../js/config";
import { getGameCovers } from "../../js/igdb";
import { Timestamp } from "firebase/firestore";

export const adminConfig = {
  title: "Game Administrator",
  description: "Manage the games database, ratings, and platforms.",
  icon: FaGamepad,
  color: "from-purple-500/20 to-indigo-500/20",
  borderColor: "border-purple-500/30",
  accentColor: "text-purple-400",
  active: true
};

const platformOptions = Object.keys(PLATFORMS);
const platformLabels = Object.fromEntries(
  platformOptions.map((key) => [key, PLATFORMS[key].label])
);
const tagsOptions = Object.keys(TAGS);
const tagsLabels = Object.fromEntries(
  tagsOptions.map((key) => [key, TAGS[key].label])
);

const ITEMS_PER_PAGE = 12;

const AdminGames = () => {
  const { userData, loading: authLoading } = useAuth();
  const { games, companies, loadingGames: loading, ensureGamesLoaded, ensureCompaniesLoaded, refreshGamesData, coverMap, setCoverMap } = useGameData();

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [editingGame, setEditingGame] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1); // Reset to page 1 on new search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);


  // Form State
  const [formData, setFormData] = useState({
    name: "",
    link: "",
    releaseDate: "",
    developers: [],
    editors: [],
    platforms: platformOptions.reduce((acc, p) => ({ ...acc, [p]: false }), {}),
    ratings: { critics: 0, players: 0, link: "" },
    tags: tagsOptions.reduce((acc, tag) => ({ ...acc, [tag]: false }), {}),
    igdb_id: "",
    developerRefs: [],
    editorRefs: [],
  });

  const [devSearch, setDevSearch] = useState("");
  const [editorSearch, setEditorSearch] = useState("");
  const [suggestionTarget, setSuggestionTarget] = useState(null);
  const [quickDevModal, setQuickDevModal] = useState({ isOpen: false, type: "", initialName: "" });
  const [releaseTba, setReleaseTba] = useState(false);

  useEffect(() => {
    ensureGamesLoaded();
    ensureCompaniesLoaded();
  }, [ensureGamesLoaded, ensureCompaniesLoaded]);

  const handleCreateNew = () => {
    setEditingGame({ id: "new" });
    setFormData({
      name: "",
      link: "",
      releaseDate: "",
      developers: [],
      editors: [],
      platforms: platformOptions.reduce((acc, p) => ({ ...acc, [p]: false }), {}),
      ratings: { critics: 0, players: 0, link: "" },
      tags: tagsOptions.reduce((acc, tag) => ({ ...acc, [tag]: false }), {}),
      igdb_id: "",
      developerRefs: [],
      editorRefs: [],
    });
    setReleaseTba(false);
  };

  const handleEdit = (game) => {
    setEditingGame(game);
    const dateStr = typeof game.release_date === "string"
      ? game.release_date
      : game.release_date?.toDate?.().toISOString().split("T")[0] || "";

    setFormData({
      name: game.name || "",
      link: game.link || "",
      releaseDate: dateStr,
      developers: game.developers || [],
      editors: game.editors || [],
      platforms: game.platforms || platformOptions.reduce((acc, p) => ({ ...acc, [p]: false }), {}),
      ratings: game.ratings || { critics: 0, players: 0, link: "" },
      tags: game.tags || tagsOptions.reduce((acc, tag) => ({ ...acc, [tag]: false }), {}),
      igdb_id: game.igdb_id || "",
      developerRefs: game.developerRefs || [],
      editorRefs: game.editorRefs || [],
    });
    setReleaseTba(typeof game.release_date === "string");
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast.error("Game name is required");
      return;
    }

    try {
      const releaseDate = releaseTba
        ? formData.releaseDate
        : (formData.releaseDate ? Timestamp.fromDate(new Date(formData.releaseDate)) : "");

      const submitData = {
        ...formData,
        release_date: releaseDate,
        ratings: {
          critics: Number(formData.ratings.critics) || 0,
          players: Number(formData.ratings.players) || 0,
          link: formData.ratings.link || ""
        }
      };

      if (editingGame.id === "new") {
        await addGameToFirestore(submitData);
        toast.success("Game created successfully!");
      } else {
        await editGameFromFirestore(editingGame.id, submitData);
        toast.success("Game updated successfully!");
      }

      setEditingGame(null);
      refreshGamesData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save game");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this game? This will also delete related playtimes.")) return;
    try {
      await deleteGameFromFirestore(id);
      toast.success("Game deleted");
      refreshGamesData();
    } catch (err) {
      toast.error("Failed to delete game");
    }
  };

  const filteredGames = useMemo(() => {
    const query = debouncedSearch.toLowerCase();
    if (!query) return games.sort((a, b) => a.name.localeCompare(b.name));
    return games
      .filter(g => g.name.toLowerCase().includes(query))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [games, debouncedSearch]);

  const paginatedGames = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredGames.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredGames, currentPage]);

  // Fetch covers for displayed games
  useEffect(() => {
    const fetchCovers = async () => {
      const idsToFetch = paginatedGames
        .map(g => g.igdb_id)
        .filter(id => id && !coverMap[id]);

      if (idsToFetch.length > 0) {
        await getGameCovers(idsToFetch, (batch) => {
          setCoverMap(prev => ({ ...prev, ...batch }));
        });
      }
    };
    fetchCovers();
  }, [paginatedGames, coverMap, setCoverMap]);

  // Fetch cover for the game being edited if igdb_id changes
  useEffect(() => {
    if (editingGame && formData.igdb_id && !coverMap[formData.igdb_id]) {
      getGameCovers([formData.igdb_id], (batch) => {
        setCoverMap(prev => ({ ...prev, ...batch }));
      });
    }
  }, [formData.igdb_id, editingGame, coverMap, setCoverMap]);

  const totalPages = Math.ceil(filteredGames.length / ITEMS_PER_PAGE);

  const existingDevs = useMemo(() => {
    return companies.filter(c => c.roles?.includes('developer'));
  }, [companies]);

  const existingEditors = useMemo(() => {
    return companies.filter(c => c.roles?.includes('editor'));
  }, [companies]);

  const handleEntitySelect = (type, entity) => {
    const refType = type === "developers" ? "developerRefs" : "editorRefs";
    const legacyType = type === "developers" ? "developers" : "editors";
    const setSearch = type === "developers" ? setDevSearch : setEditorSearch;

    if (formData[refType].some(ref => (typeof ref === 'string' ? ref : ref.devId) === (entity.slug || entity.id))) {
      toast.info(`${entity.name} is already added.`);
      setSearch("");
      setSuggestionTarget(null);
      return;
    }

    setFormData(prev => ({
      ...prev,
      [refType]: [...prev[refType], { devId: entity.slug || entity.id }],
      [legacyType]: [...prev[legacyType], { name: entity.name, link: entity.website || entity.link || "" }]
    }));

    setSearch("");
    setSuggestionTarget(null);
  };

  const removeEntity = (type, index) => {
    const refType = type === "developers" ? "developerRefs" : "editorRefs";
    const legacyType = type === "developers" ? "developers" : "editors";
    setFormData(prev => ({
      ...prev,
      [refType]: prev[refType].filter((_, i) => i !== index),
      [legacyType]: prev[legacyType].filter((_, i) => i !== index)
    }));
  };

  if (authLoading) return (
    <Layout>
      <div className="flex justify-center items-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    </Layout>
  );

  if (!userData?.isAdmin) return <Navigate to="/" />;

  return (
    <Layout>
      <div className="mx-auto max-w-7xl px-6 py-10">
        <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
              Game Administrator
            </h1>
            <p className="text-white/40 font-bold uppercase tracking-widest text-sm mt-2">
              Manage database entries and game details
            </p>
          </div>

          {!editingGame ? (
            <button
              onClick={handleCreateNew}
              className="flex items-center gap-2 bg-gradient-primary px-6 py-3 rounded-2xl font-bold shadow-xl hover:scale-105 transition-transform"
            >
              <FaPlus /> Add New Game
            </button>
          ) : (
            <button
              onClick={() => setEditingGame(null)}
              className="flex items-center gap-2 bg-white/10 px-6 py-3 rounded-2xl font-bold hover:bg-white/20 transition-colors"
            >
              <FiX /> Cancel
            </button>
          )}
        </header>

        {editingGame ? (
          <div className="space-y-8 pb-20">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Form */}
              <div className="lg:col-span-2 space-y-8">
                {/* Main Info */}
                <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md">
                  <h2 className="text-xl font-black mb-6 flex items-center gap-3">
                    <FaGamepad className="text-white/20" />
                    General Information
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-black uppercase tracking-widest text-white/40 mb-3">Game Title</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-black/20 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-white/30 font-bold text-lg"
                        placeholder="e.g. Elden Ring"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase tracking-widest text-white/40 mb-3">Release Date</label>
                      <div className="flex gap-2">
                        <input
                          type={releaseTba ? "text" : "date"}
                          value={formData.releaseDate}
                          onChange={(e) => setFormData({ ...formData, releaseDate: e.target.value })}
                          className="flex-1 bg-black/20 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-white/30 font-bold"
                          placeholder={releaseTba ? "e.g. TBA 2025" : ""}
                        />
                        <button
                          onClick={() => setReleaseTba(!releaseTba)}
                          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${releaseTba ? "bg-gradient-primary border-transparent text-white" : "border-white/10 text-white/40"}`}
                        >
                          TBA
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase tracking-widest text-white/40 mb-3">Website Link</label>
                      <input
                        type="text"
                        value={formData.link}
                        onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                        className="w-full bg-black/20 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-white/30 font-mono text-sm"
                        placeholder="https://..."
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-black uppercase tracking-widest text-white/40 mb-3">IGDB ID (for automatic cover & data)</label>
                      <input
                        type="text"
                        value={formData.igdb_id}
                        onChange={(e) => setFormData({ ...formData, igdb_id: e.target.value })}
                        className="w-full bg-black/20 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-white/30 font-mono text-sm"
                        placeholder="e.g. 195602"
                      />
                    </div>
                  </div>
                </div>

                {/* Companies Section */}
                <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md">
                  <h2 className="text-xl font-black mb-6 flex items-center gap-3">
                    <FaHammer className="text-white/20" />
                    Developers & Publishers
                  </h2>

                  <div className="space-y-8">
                    {/* Developers */}
                    <div>
                      <label className="block text-xs font-black uppercase tracking-widest text-white/40 mb-4">Developers</label>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {formData.developerRefs.map((ref, idx) => {
                          const devId = typeof ref === 'string' ? ref : ref?.devId;
                          const dev = companies.find(c => c.id === devId || c.slug === devId);
                          return (
                            <div key={idx} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl pl-2 pr-3 py-1.5 group">
                              <div className="size-6 rounded bg-white/10 overflow-hidden">
                                {dev?.logo && <img src={dev.logo} alt="" className="w-full h-full object-contain" />}
                              </div>
                              <span className="text-sm font-bold">{dev?.name || "Unknown"}</span>
                              <button onClick={() => removeEntity("developers", idx)} className="text-white/20 hover:text-red-400">
                                <FiX />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                      <div className="relative">
                        <div className="relative group">
                          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                          <input
                            type="text"
                            value={devSearch}
                            onChange={(e) => setDevSearch(e.target.value)}
                            onFocus={() => setSuggestionTarget({ type: "developers" })}
                            className="w-full bg-black/20 border border-white/10 rounded-2xl pl-12 pr-12 py-3 focus:outline-none focus:border-white/30 font-bold text-sm"
                            placeholder="Search developers..."
                          />
                          {devSearch && (
                            <button
                              onClick={() => setQuickDevModal({ isOpen: true, type: "developers", initialName: devSearch })}
                              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all"
                            >
                              <FiPlusCircle size={16} />
                            </button>
                          )}
                        </div>
                        {suggestionTarget?.type === "developers" && (
                          <SuggestionDropdown
                            suggestions={existingDevs}
                            value={devSearch}
                            onSelect={(selected) => handleEntitySelect("developers", selected)}
                          />
                        )}
                      </div>
                    </div>

                    {/* Editors */}
                    <div>
                      <label className="block text-xs font-black uppercase tracking-widest text-white/40 mb-4">Publishers</label>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {formData.editorRefs.map((ref, idx) => {
                          const edId = typeof ref === 'string' ? ref : ref?.devId;
                          const ed = companies.find(c => c.id === edId || c.slug === edId);
                          return (
                            <div key={idx} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl pl-2 pr-3 py-1.5 group">
                              <div className="size-6 rounded bg-white/10 overflow-hidden">
                                {ed?.logo && <img src={ed.logo} alt="" className="w-full h-full object-contain" />}
                              </div>
                              <span className="text-sm font-bold">{ed?.name || "Unknown"}</span>
                              <button onClick={() => removeEntity("editors", idx)} className="text-white/20 hover:text-red-400">
                                <FiX />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                      <div className="relative">
                        <div className="relative group">
                          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                          <input
                            type="text"
                            value={editorSearch}
                            onChange={(e) => setEditorSearch(e.target.value)}
                            onFocus={() => setSuggestionTarget({ type: "editors" })}
                            className="w-full bg-black/20 border border-white/10 rounded-2xl pl-12 pr-12 py-3 focus:outline-none focus:border-white/30 font-bold text-sm"
                            placeholder="Search publishers..."
                          />
                          {editorSearch && (
                            <button
                              onClick={() => setQuickDevModal({ isOpen: true, type: "editors", initialName: editorSearch })}
                              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all"
                            >
                              <FiPlusCircle size={16} />
                            </button>
                          )}
                        </div>
                        {suggestionTarget?.type === "editors" && (
                          <SuggestionDropdown
                            suggestions={existingEditors}
                            value={editorSearch}
                            onSelect={(selected) => handleEntitySelect("editors", selected)}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Sidebar fields */}
              <div className="space-y-8">
                {/* Platforms & Tags */}
                <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md">
                  <h2 className="text-xl font-black mb-6 flex items-center gap-3">
                    <FaDesktop className="text-white/20" />
                    Platforms & Tags
                  </h2>

                  <div className="space-y-8">
                    <div>
                      <label className="block text-xs font-black uppercase tracking-widest text-white/40 mb-4">Platforms</label>
                      <div className="flex flex-wrap gap-2">
                        {platformOptions.map(p => (
                          <button
                            key={p}
                            onClick={() => setFormData({ ...formData, platforms: { ...formData.platforms, [p]: !formData.platforms[p] } })}
                            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${formData.platforms[p] ? "bg-gradient-primary border-transparent text-white" : "bg-white/5 border-white/10 text-white/40"}`}
                          >
                            {platformLabels[p]}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase tracking-widest text-white/40 mb-4">Features / Tags</label>
                      <div className="flex flex-wrap gap-2">
                        {tagsOptions.map(t => (
                          <button
                            key={t}
                            onClick={() => setFormData({ ...formData, tags: { ...formData.tags, [t]: !formData.tags[t] } })}
                            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${formData.tags[t] ? "bg-gradient-secondary border-transparent text-white" : "bg-white/5 border-white/10 text-white/40"}`}
                          >
                            {tagsLabels[t]}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ratings */}
                <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md">
                  <h2 className="text-xl font-black mb-6 flex items-center gap-3">
                    <FaChartBar className="text-white/20" />
                    Ratings
                  </h2>
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-black uppercase tracking-widest text-white/40 mb-3">Critics</label>
                        <input
                          type="number"
                          value={formData.ratings.critics}
                          onChange={(e) => setFormData({ ...formData, ratings: { ...formData.ratings, critics: e.target.value } })}
                          className="w-full bg-black/20 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-white/30 font-black text-xl text-center"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-black uppercase tracking-widest text-white/40 mb-3">Players</label>
                        <input
                          type="number"
                          value={formData.ratings.players}
                          onChange={(e) => setFormData({ ...formData, ratings: { ...formData.ratings, players: e.target.value } })}
                          className="w-full bg-black/20 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-white/30 font-black text-xl text-center"
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-black uppercase tracking-widest text-white/40 mb-3">OpenCritic URL</label>
                      <input
                        type="text"
                        value={formData.ratings.link}
                        onChange={(e) => setFormData({ ...formData, ratings: { ...formData.ratings, link: e.target.value } })}
                        className="w-full bg-black/20 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-white/30 font-mono text-xs"
                        placeholder="https://opencritic..."
                      />
                    </div>
                  </div>
                </div>

                {/* Cover Preview */}
                <div className="bg-white/5 border border-white/10 rounded-3xl p-4 backdrop-blur-md flex flex-col items-center gap-4">
                  <div className="w-full aspect-[3/4] rounded-2xl overflow-hidden bg-black/40">
                    <SmartCover src={coverMap[formData.igdb_id]} alt="Preview" className="w-full h-full" />
                  </div>
                  <p className="text-[10px] font-black uppercase text-white/20 tracking-widest">Cover Preview (from IGDB)</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setEditingGame(null)}
                className="px-10 py-5 rounded-2xl font-black text-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-3 bg-gradient-primary px-12 py-5 rounded-2xl font-black text-lg shadow-2xl hover:scale-105 transition-transform"
              >
                <FaSave /> Save Game Record
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-10">
            {/* Navigation & Search */}
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1 relative group">
                <FiSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white transition-colors text-xl" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search games database..."
                  className="w-full bg-white/5 border border-white/10 rounded-[2rem] pl-16 pr-8 py-6 focus:outline-none focus:border-white/20 font-bold text-lg backdrop-blur-md"
                />
              </div>
            </div>

            {/* Pagination Top */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                  className="p-4 bg-white/5 border border-white/10 rounded-2xl disabled:opacity-20 hover:bg-white/10 transition-colors"
                >
                  <FiChevronLeft size={24} />
                </button>
                <div className="bg-white/5 border border-white/10 px-8 py-4 rounded-2xl font-black text-white/60">
                  Page <span className="text-white text-lg">{currentPage}</span> <span className="mx-2 text-white/20">/</span> {totalPages}
                </div>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                  className="p-4 bg-white/5 border border-white/10 rounded-2xl disabled:opacity-20 hover:bg-white/10 transition-colors"
                >
                  <FiChevronRight size={24} />
                </button>
              </div>
            )}

            {loading ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                  {paginatedGames.map((game) => (
                    <GameCardAdmin
                      key={game.id}
                      game={game}
                      handleEdit={handleEdit}
                      handleDelete={handleDelete}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Pagination Bottom */}
            {!loading && totalPages > 1 && (
              <div className="flex flex-col items-center gap-6 pt-10 border-t border-white/5">
                <div className="flex items-center justify-center gap-4">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => {
                      setCurrentPage(p => p - 1);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="p-4 bg-white/5 border border-white/10 rounded-2xl disabled:opacity-20 hover:bg-white/10 transition-colors"
                  >
                    <FiChevronLeft size={24} />
                  </button>
                  <div className="flex gap-2">
                    {[...Array(Math.min(5, totalPages))].map((_, i) => {
                      let pageNum;
                      if (totalPages <= 5) pageNum = i + 1;
                      else if (currentPage <= 3) pageNum = i + 1;
                      else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                      else pageNum = currentPage - 2 + i;

                      return (
                        <button
                          key={pageNum}
                          onClick={() => {
                            setCurrentPage(pageNum);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                          className={`size-12 rounded-xl flex items-center justify-center font-black transition-all ${currentPage === pageNum ? "bg-gradient-primary text-white scale-110 shadow-lg" : "bg-white/5 hover:bg-white/10 text-white/40"}`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => {
                      setCurrentPage(p => p + 1);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="p-4 bg-white/5 border border-white/10 rounded-2xl disabled:opacity-20 hover:bg-white/10 transition-colors"
                  >
                    <FiChevronRight size={24} />
                  </button>
                </div>
                <p className="text-white/20 font-black uppercase tracking-[0.2em] text-[10px]">
                  Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredGames.length)} of {filteredGames.length} games
                </p>
              </div>
            )}

            {!loading && filteredGames.length === 0 && (
              <div className="text-center py-24 bg-white/5 rounded-[3rem] border border-dashed border-white/10">
                <FaGamepad className="mx-auto size-16 text-white/5 mb-6" />
                <p className="text-white/40 text-xl font-bold italic">No games found matching your search.</p>
              </div>
            )}
          </div>
        )}
      </div>

      <QuickDeveloperModal
        isOpen={quickDevModal.isOpen}
        type={quickDevModal.type}
        initialName={quickDevModal.initialName}
        onClose={() => setQuickDevModal({ ...quickDevModal, isOpen: false })}
        onCreated={(newEntity) => handleEntitySelect(quickDevModal.type, newEntity)}
      />
    </Layout>
  );
};

const GameCardAdmin = memo(({ game, handleEdit, handleDelete }) => {
  const { coverMap } = useGameData();
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden backdrop-blur-sm hover:border-white/20 transition-all group p-4 flex gap-4"
    >
      <div className="w-24 aspect-[3/4] rounded-2xl overflow-hidden bg-black/40 flex-shrink-0 shadow-lg">
        <SmartCover src={coverMap[game.igdb_id]} alt={game.name} className="w-full h-full" />
      </div>

      <div className="flex-1 min-w-0 flex flex-col pt-1">
        <div className="flex justify-between items-start mb-1">
          <h3 className="text-lg font-black truncate text-white leading-tight">
            {he.decode(game.name)}
          </h3>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-1.5 bg-white/5 px-2 py-0.5 rounded-lg border border-white/5">
            <FaStar size={10} className="text-amber-400" />
            <span className="text-[10px] font-black text-white/80">{game.ratings?.critics || 0}</span>
          </div>
          <div className="text-[10px] font-bold text-white/20 uppercase tracking-widest">
            {typeof game.release_date === "string"
              ? game.release_date
              : (game.release_date?.toDate ? game.release_date.toDate().getFullYear() : "TBA")}
          </div>
        </div>

        <div className="mt-auto flex justify-end gap-2">
          <button
            onClick={() => handleEdit(game)}
            className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors text-white/40 hover:text-white"
            title="Edit Game"
          >
            <FaEdit size={14} />
          </button>
          <button
            onClick={() => handleDelete(game.id)}
            className="p-3 bg-white/5 hover:bg-red-500/20 rounded-xl transition-colors text-white/40 hover:text-red-400"
            title="Delete Game"
          >
            <FaTrash size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  );
});

export default AdminGames;
