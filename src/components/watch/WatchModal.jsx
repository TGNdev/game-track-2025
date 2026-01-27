import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiLink, FiUser, FiTarget, FiSearch } from "react-icons/fi";
import { FaStar } from "react-icons/fa";
import { matchesSearch } from "../../js/utils";
import { useGameData } from "../../contexts/GameDataContext";
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

const CATEGORIES = [
  "Rumor",
  "Confirmation",
  "Layoffs",
  "Closure",
  "Acquisition",
  "Legal",
  "Financial",
  "Other"
];

const WatchModal = ({ isOpen, onClose, onSave, initialData = null, initialGameId = "", initialGameName = "" }) => {
  const { games } = useGameData();
  const [formData, setFormData] = useState({
    title: "",
    source: "",
    author: "",
    summary: "",
    category: "Rumor",
    gameId: "",
    gameName: ""
  });

  const [showGames, setShowGames] = useState(false);
  const [search, setSearch] = useState("");

  const filteredGames = useMemo(() => {
    if (!search) return games.slice(0, 10);
    return games
      .sort((a, b) => matchesSearch(b.name, search) - matchesSearch(a.name, search))
      .filter(g => matchesSearch(g.name, search))
      .slice(0, 10);
  }, [games, search]);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          title: initialData.title || "",
          source: initialData.source || "",
          author: initialData.author || "",
          summary: initialData.summary || "",
          category: initialData.category || "Rumor",
          gameId: initialData.gameId || "",
          gameName: initialData.gameName || ""
        });
      } else {
        setFormData({
          title: "",
          source: "",
          author: "",
          summary: "",
          category: "Rumor",
          gameId: initialGameId || "",
          gameName: initialGameName || ""
        });
      }
    }
  }, [initialData, isOpen, initialGameId, initialGameName]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 backdrop-blur-md bg-black/40"
          onClick={onClose}
        />

        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-2xl bg-[#1a1a1a] border border-white/10 rounded-3xl p-8 shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar"
        >
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 text-white/30 hover:text-white transition-colors hover:bg-white/10 rounded-full"
          >
            <FiX size={24} />
          </button>

          <h2 className="text-3xl font-black mb-8 bg-gradient-to-r from-white to-white/50 bg-clip-text text-transparent">
            {initialData ? "Edit Industry Watch" : "New Industry Watch"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Title */}
              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-white/40 ml-1">Title</label>
                <div className="relative">
                  <input
                    required
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-4 text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 transition-all font-bold"
                    placeholder="E.g. Sony acquires FromSoftware"
                  />
                </div>
              </div>

              {/* Source Link */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-white/40 ml-1">Source Link</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20">
                    <FiLink size={18} />
                  </div>
                  <input
                    required
                    type="url"
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 transition-all font-bold"
                    placeholder="https://..."
                  />
                </div>
              </div>

              {/* Author */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-white/40 ml-1">Reporter / Source Name</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20">
                    <FiUser size={18} />
                  </div>
                  <input
                    required
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 transition-all font-bold"
                    placeholder="Jason Schreier"
                  />
                </div>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-white/40 ml-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-[#2a2a2a] border border-white/10 rounded-xl py-4 px-4 text-white focus:outline-none focus:border-primary/50 transition-all font-bold appearance-none cursor-pointer"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              {/* Game Association */}
              <div className="md:col-span-2 space-y-2 relative">
                <label className="text-xs font-black uppercase tracking-widest text-white/40 ml-1">Related Game</label>
                <div
                  onClick={() => setShowGames(!showGames)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-4 cursor-pointer text-white focus:outline-none focus:border-primary/50 transition-all font-bold flex items-center justify-between group hover:border-white/20"
                >
                  <span className={formData.gameName ? "text-white" : "text-white/20"}>
                    {formData.gameName || "Select a game (or type a name below)..."}
                  </span>
                  <FaStar className={`size-4 transition-colors ${formData.gameId ? 'text-[#ff9e43]' : 'text-white/10'}`} />
                </div>

                <AnimatePresence>
                  {showGames && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute z-50 top-full left-0 right-0 mt-2 bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden backdrop-blur-xl"
                    >
                      <div className="p-3 border-b border-white/5 bg-white/5">
                        <div className="relative">
                          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                          <input
                            autoFocus
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search games in database..."
                            className="w-full bg-white/5 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none border border-white/5 focus:border-white/10 transition-all"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>
                      <div className="max-h-60 overflow-y-auto custom-scrollbar">
                        <div
                          onClick={() => {
                            setFormData({ ...formData, gameId: "", gameName: "" });
                            setShowGames(false);
                            setSearch("");
                          }}
                          className="px-5 py-3 hover:bg-white/5 cursor-pointer text-sm font-bold text-white/40 border-b border-white/5 italic"
                        >
                          None / Manual entry
                        </div>
                        {filteredGames.map(game => (
                          <div
                            key={game.id}
                            onClick={() => {
                              setFormData({ ...formData, gameId: game.id, gameName: game.name });
                              setShowGames(false);
                              setSearch("");
                            }}
                            className="px-5 py-3 hover:bg-white/5 cursor-pointer text-sm font-bold border-b border-white/5 last:border-none flex items-center justify-between group/item"
                          >
                            <span className="group-hover/item:text-primary-light transition-colors">{game.name}</span>
                            <span className="text-[10px] opacity-40 uppercase tracking-widest">{game.developers?.[0]?.name}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Manual Game Name (if not in app) */}
              {!formData.gameId && (
                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-white/40 ml-1">Manual Game Entry (if not in database)</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20">
                      <FiTarget size={18} />
                    </div>
                    <input
                      type="text"
                      value={formData.gameName}
                      onChange={(e) => setFormData({ ...formData, gameName: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 transition-all font-bold"
                      placeholder="E.g. GTA VI"
                    />
                  </div>
                </div>
              )}

              {/* Summary */}
              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-white/40 ml-1">Summary</label>
                <div className="relative rich-text-editor">
                  <ReactQuill
                    theme="snow"
                    value={formData.summary}
                    onChange={(content) => setFormData({ ...formData, summary: content })}
                    placeholder="Write a brief summary of the news..."
                    modules={{
                      toolbar: [
                        ['bold', 'italic', 'underline'],
                        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                        ['link', 'clean']
                      ],
                    }}
                  />
                </div>
              </div>

              <style>{`
                .rich-text-editor .ql-container {
                  background: rgba(255, 255, 255, 0.05);
                  border: 1px solid rgba(255, 255, 255, 0.1) !important;
                  border-bottom-left-radius: 12px;
                  border-bottom-right-radius: 12px;
                  color: white;
                  font-family: inherit;
                  font-size: 16px;
                  min-height: 150px;
                }
                .rich-text-editor .ql-toolbar {
                  background: rgba(255, 255, 255, 0.08);
                  border: 1px solid rgba(255, 255, 255, 0.1) !important;
                  border-top-left-radius: 12px;
                  border-top-right-radius: 12px;
                  padding: 8px;
                }
                .rich-text-editor .ql-stroke {
                  stroke: rgba(255, 255, 255, 0.6) !important;
                }
                .rich-text-editor .ql-fill {
                  fill: rgba(255, 255, 255, 0.6) !important;
                }
                .rich-text-editor .ql-picker {
                  color: rgba(255, 255, 255, 0.6) !important;
                }
                .rich-text-editor .ql-editor.ql-blank::before {
                  color: rgba(255, 255, 255, 0.2) !important;
                  font-style: normal;
                }
                .rich-text-editor .ql-editor {
                   padding: 16px;
                }
                .rich-text-editor .ql-snow.ql-toolbar button:hover .ql-stroke {
                  stroke: #b069ff !important;
                }
                .rich-text-editor .ql-snow.ql-toolbar button.ql-active .ql-stroke {
                  stroke: #b069ff !important;
                }
              `}</style>
            </div>

            <button
              type="submit"
              className="w-full py-5 rounded-2xl bg-gradient-to-r from-primary to-primary-light text-white font-black text-lg shadow-xl hover:scale-[1.02] active:scale-95 transition-all mt-4"
            >
              {initialData ? "Update Article" : "Publish to Industry Watch"}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default WatchModal;
