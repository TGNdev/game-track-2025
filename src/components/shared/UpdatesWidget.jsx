import React, { useState, useEffect } from "react";
import { useGameData } from "../../contexts/GameDataContext";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiBell, FiX, FiChevronRight, FiMessageSquare } from "react-icons/fi";
import { format } from "date-fns";
import { slugify } from "../../js/utils";

const UpdatesWidget = () => {
  const { updates, ensureUpdatesLoaded, loadingUpdates } = useGameData();
  const [isOpen, setIsOpen] = useState(false);
  const [hasNew, setHasNew] = useState(false);
  const [showBubble, setShowBubble] = useState(false);
  const [latestUpdate, setLatestUpdate] = useState(null);

  useEffect(() => {
    ensureUpdatesLoaded();
  }, [ensureUpdatesLoaded]);

  useEffect(() => {
    if (updates.length > 0) {
      const sorted = [...updates].sort((a, b) => new Date(b.date) - new Date(a.date));
      const currentLatest = sorted[0];
      const lastSeen = localStorage.getItem("lastSeenUpdateDate");

      // If we have a new update that we haven't seen yet
      if (!lastSeen || new Date(currentLatest.date) > new Date(lastSeen)) {
        setHasNew(true);

        // Show bubble if the widget is NOT open and this is a NEW update (not just first load)
        if (!isOpen && latestUpdate && currentLatest.id !== latestUpdate.id) {
          setLatestUpdate(currentLatest);
          setShowBubble(true);
          // Hide bubble after 8 seconds
          const timer = setTimeout(() => setShowBubble(false), 8000);
          return () => clearTimeout(timer);
        }
      }
      setLatestUpdate(currentLatest);
    }
  }, [updates, isOpen, latestUpdate]);

  const handleOpen = () => {
    setIsOpen(true);
    setHasNew(false);
    setShowBubble(false);
    if (updates.length > 0) {
      const sorted = [...updates].sort((a, b) => new Date(b.date) - new Date(a.date));
      localStorage.setItem("lastSeenUpdateDate", sorted[0].date);
    }
  };

  const latestUpdatesSnapshot = [...updates]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 3);

  return (
    <div className="fixed bottom-6 left-6 z-[100]">
      <AnimatePresence mode="wait">
        {showBubble && !isOpen && latestUpdate && (
          <motion.div
            initial={{ opacity: 0, x: -20, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -20, scale: 0.8 }}
            onClick={handleOpen}
            className="absolute bottom-20 left-0 w-[280px] bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 shadow-2xl cursor-pointer hover:bg-white/15 transition-all group"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-[#b069ff]/20 rounded-lg shrink-0">
                <FiBell className="size-4 text-[#b069ff]" />
              </div>
              <div className="space-y-1 min-w-0">
                <h4 className="font-black text-xs uppercase tracking-widest text-[#b069ff] flex items-center gap-2">
                  New Update
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                </h4>
                <p className="font-bold text-sm truncate">{latestUpdate.gameName}</p>
                <p className="text-xs text-white/60 line-clamp-2 leading-relaxed italic">
                  "{latestUpdate.message}"
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowBubble(false);
                }}
                className="p-1 hover:bg-white/10 rounded-md transition-colors"
              >
                <FiX className="size-3 text-white/40" />
              </button>
            </div>
          </motion.div>
        )}

        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="absolute bottom-20 left-0 w-[320px] bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-[#b069ff]/5 to-transparent">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-xl">
                  <FiBell className="size-4 text-white/40" />
                </div>
                <h3 className="font-black uppercase tracking-widest text-xs">What's New</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/5 rounded-xl transition-colors"
                aria-label="Close"
              >
                <FiX className="size-4 text-white/40" />
              </button>
            </div>
            <div className="max-h-[350px] overflow-y-auto custom-scrollbar p-6 space-y-6">
              {loadingUpdates && updates.length === 0 ? (
                <div className="py-8 text-center space-y-3">
                  <div className="w-8 h-8 border-2 border-[#b069ff]/20 border-t-[#b069ff] rounded-full animate-spin mx-auto" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Checking updates...</p>
                </div>
              ) : latestUpdatesSnapshot.length === 0 ? (
                <div className="py-8 text-center space-y-3 opacity-40">
                  <FiMessageSquare className="size-8 mx-auto" />
                  <p className="text-xs font-bold">No updates yet</p>
                </div>
              ) : (
                latestUpdatesSnapshot.map((update) => (
                  <div key={update.id} className="space-y-2 group">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/30">
                        {format(new Date(update.date), "MMM d, yyyy")}
                      </span>
                      <Link
                        to={`/games/${slugify(update.gameName)}`}
                        className="text-[10px] font-black uppercase tracking-widest text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => setIsOpen(false)}
                      >
                        Game Details
                      </Link>
                    </div>
                    <h4 className="font-black text-sm tracking-tight">{update.gameName}</h4>
                    <p className="text-xs text-white/50 leading-relaxed line-clamp-2">
                      {update.message}
                    </p>
                  </div>
                ))
              )}
            </div>
            <Link
              to="/whats-new"
              onClick={() => setIsOpen(false)}
              className="group p-5 bg-white/5 hover:bg-white/10 transition-all flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white"
            >
              See all updates
              <FiChevronRight className="size-3 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={isOpen ? () => setIsOpen(false) : handleOpen}
        className={`relative p-5 rounded-[1.5rem] shadow-2xl transition-all ${isOpen
          ? "bg-white text-black"
          : "bg-gradient-primary text-white shadow-[#b069ff]/20"
          }`}
      >
        <FiBell className={`size-6 ${isOpen ? "text-black" : "text-white"}`} />
        {hasNew && !isOpen && (
          <span className="absolute top-4 right-4 w-3 h-3 bg-red-500 border-2 border-[#b069ff] rounded-full" />
        )}
      </motion.button>
    </div>
  );
};

export default UpdatesWidget;
