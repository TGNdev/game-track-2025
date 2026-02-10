import React, { useEffect, useState, useMemo } from "react";
import { useGameData } from "../contexts/GameDataContext";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { FiExternalLink, FiCalendar, FiMessageSquare, FiSearch, FiFrown } from "react-icons/fi";
import Layout from "../components/shared/Layout";
import { slugify } from "../js/utils";

const WhatsNew = () => {
  const { updates, ensureUpdatesLoaded, loadingUpdates } = useGameData();
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    ensureUpdatesLoaded();
  }, [ensureUpdatesLoaded]);

  const filteredUpdates = useMemo(() => {
    const sorted = [...updates].sort((a, b) => new Date(b.date) - new Date(a.date));

    if (!searchTerm) return sorted;

    const s = searchTerm.toLowerCase();
    return sorted.filter(u =>
      u.gameName.toLowerCase().includes(s) ||
      u.message.toLowerCase().includes(s)
    );
  }, [updates, searchTerm]);

  return (
    <Layout>
      <div className="max-w-[1400px] mx-auto px-6 pb-12 md:py-20 space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-[0_0_20px_rgba(176,105,255,0.4)]">
                <FiMessageSquare size={24} className="text-white" />
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
                What's New
              </h1>
            </div>
            <p className="text-white/40 font-medium max-w-xl text-lg leading-relaxed">
              Stay updated on games featured on Game Track.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 justify-end">
          <div className="relative w-full sm:w-80 group">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#b069ff] transition-colors" />
            <input
              type="text"
              placeholder="Search updates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white font-bold placeholder:text-white/20 focus:outline-none focus:border-[#b069ff]/50 focus:bg-white/[0.08] transition-all shadow-xl"
            />
          </div>
        </div>

        <div className="space-y-8 min-h-[400px]">
          {loadingUpdates && updates.length === 0 ? (
            <div className="grid grid-cols-1 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-white/5 border border-white/10 rounded-[2rem] animate-pulse" />
              ))}
            </div>
          ) : filteredUpdates.length > 0 ? (
            <div className="space-y-6">
              <AnimatePresence mode="popLayout">
                {filteredUpdates.map((update, index) => (
                  <motion.div
                    key={update.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="relative"
                  >
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-[#b069ff]/20 to-transparent rounded-[2rem] opacity-0 transition duration-500 blur" />
                    <div className="relative bg-white/5 border border-white/10 p-5 rounded-[2rem] hover:bg-white/[0.07] transition-all overflow-hidden backdrop-blur-sm">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                        <div className="space-y-4 flex-1">
                          <div className="flex items-center gap-3">
                            <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest text-white/50">
                              Game Update
                            </div>
                            <div className="flex items-center gap-1.5 text-white/30 text-xs font-bold">
                              <FiCalendar className="size-3.5" />
                              {format(new Date(update.date), "MMMM d, yyyy")}
                            </div>
                          </div>
                          <div
                            className="text-base"
                            dangerouslySetInnerHTML={{ __html: update.message }}
                          />
                        </div>
                        <Link
                          to={`/games/${slugify(update.gameName)}`}
                          className="inline-flex items-center gap-2 px-4 py-3 bg-gradient-primary rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all"
                        >
                          View Game
                          <FiExternalLink />
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 text-center space-y-4 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-sm"
            >
              <div className="p-6 bg-white/5 rounded-full">
                <FiFrown size={48} className="text-white/20" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-black text-white">No updates found</h3>
                <p className="text-white/40 font-medium tracking-wide prose max-w-xs mx-auto">
                  Try adjusting your search terms or check back later for new updates.
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default WhatsNew;
