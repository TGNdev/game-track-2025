import { motion, AnimatePresence } from 'framer-motion';
import { FaTrophy, FaSearch, FaExternalLinkAlt, FaChevronDown } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { slugify } from '../../js/utils';
import Pagination from '../shared/Pagination';
import { useGameUI } from '../../contexts/GameUIContext';

const Leaderboard = ({ tga, getGameById, coverMap }) => {
  const navigate = useNavigate();
  const { isMobile } = useGameUI();
  const [expandedGameId, setExpandedGameId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  const leaderboardData = useMemo(() => {
    const winners = {};

    tga.forEach(yearObj => {
      yearObj.awards.forEach(award => {
        let winningGameIds = [];

        if (award.nominees && award.nominees.length > 0) {
          const winnersInCategory = award.nominees.filter(n => n.isWinner);
          winnersInCategory.forEach(w => {
            if (w.gameId) winningGameIds.push(w.gameId);
          });
        } else if (award.gameId) {
          winningGameIds.push(award.gameId);
        }

        winningGameIds.forEach(gameId => {
          if (!winners[gameId]) {
            winners[gameId] = {
              gameId,
              count: 0,
              awards: []
            };
          }
          winners[gameId].count += 1;
          winners[gameId].awards.push({
            year: yearObj.year,
            category: award.title
          });
        });
      });
    });

    const sorted = Object.values(winners).sort((a, b) => b.count - a.count);
    let currentRank = 1;
    sorted.forEach((item, idx) => {
      if (idx > 0 && item.count < sorted[idx - 1].count) {
        currentRank = idx + 1;
      }
      item.rank = currentRank;
    });
    return sorted;
  }, [tga]);

  const filteredData = useMemo(() => {
    if (!searchQuery) return leaderboardData;
    return leaderboardData.filter(data => {
      const game = getGameById(data.gameId);
      if (!game) return false;
      return game.name.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [leaderboardData, searchQuery, getGameById]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemsPerPageChange = (newSize) => {
    setItemsPerPage(newSize);
    setCurrentPage(1);
  };

  if (leaderboardData.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="px-0 py-8 max-w-5xl mx-auto"
    >
      <div className="flex flex-col items-center mb-12 relative">
        <h3 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-200 bg-clip-text text-transparent text-center drop-shadow-sm">
          Hall of Fame
        </h3>
        <p className="text-white/60 mt-4 text-center max-w-xl text-lg px-4">
          The most awarded games in the history of The Game Awards.
        </p>
        <div className="h-1 w-24 bg-gradient-to-r from-amber-500 to-yellow-300 mt-6 rounded-full shadow-[0_0_15px_rgba(251,191,36,0.6)]" />
      </div>

      <div className="flex justify-center mb-8">
        <div className="relative w-full max-w-md">
          <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="Search game..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary-light transition-all shadow-inner"
          />
        </div>
      </div>

      {filteredData.length === 0 ? (
        <div className="text-center py-12 text-white/40 italic">
          No games found matching "{searchQuery}"
        </div>
      ) : (
        <div className="space-y-4">
          {paginatedData.map((data) => {
            const game = getGameById(data.gameId);
            if (!game) return null;

            const cover = coverMap ? coverMap[game.igdb_id] : null;
            const coverUrl = cover ? cover : "/default-cover.jpg";

            let rankColor = "text-white/40";
            let badgeColor = "bg-white/5 border-white/10";

            const actualRank = data.rank;

            if (actualRank === 1) {
              rankColor = "text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]";
              badgeColor = "bg-yellow-500/10 border-yellow-500/30";
            } else if (actualRank === 2) {
              rankColor = "text-gray-300 drop-shadow-[0_0_8px_rgba(209,213,219,0.5)]";
              badgeColor = "bg-gray-400/10 border-gray-400/30";
            } else if (actualRank === 3) {
              rankColor = "text-amber-600 drop-shadow-[0_0_8px_rgba(217,119,6,0.5)]";
              badgeColor = "bg-amber-700/10 border-amber-700/30";
            }

            const isExpanded = expandedGameId === data.gameId;

            return (
              <motion.div
                key={data.gameId}
                className={`bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm transition-all hover:bg-white/10 group ${isExpanded ? "ring-1 ring-white/20" : ""}`}
              >
                <div
                  className="flex items-center p-3 sm:p-4 cursor-pointer"
                  onClick={() => setExpandedGameId(isExpanded ? null : data.gameId)}
                >
                  <div className={`w-16 sm:w-32 font-black text-3xl sm:text-5xl text-left ${rankColor}`}>
                    #{actualRank}
                  </div>

                  <div className="relative w-14 sm:w-20 aspect-[3/4] rounded-md overflow-hidden flex-shrink-0 shadow-lg ml-2 sm:ml-0">
                    <img src={coverUrl} alt={game.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  </div>

                  <div className="ml-3 sm:ml-8 flex-1 min-w-0">
                    <h4 className="text-lg sm:text-2xl w-fit font-bold text-white sm:truncate flex items-center gap-2 hover:text-white/60 transition-colors" onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/games/${slugify(game.name)}`);
                    }}>
                      {game.name}
                      <FaExternalLinkAlt size={12} className="hidden sm:block" />
                    </h4>
                    <div className="flex items-center gap-2 mt-1 sm:mt-2">
                      <div className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full border ${badgeColor}`}>
                        <FaTrophy className={actualRank === 1 ? "text-yellow-400" : actualRank === 2 ? "text-gray-300" : actualRank === 3 ? "text-amber-600" : "text-white/60"} size={10} />
                        <span className="text-xs sm:text-sm font-bold text-white/90">{data.count} Awards</span>
                      </div>
                    </div>
                  </div>

                  <div className="ml-auto pl-4">
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                      className="text-white/20 group-hover:text-white/40"
                    >
                      <FaChevronDown size={20} />
                    </motion.div>
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="border-t border-white/5 bg-black/20"
                    >
                      <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {data.awards.map((award, i) => (
                          <div key={i} className="flex items-start gap-3 bg-white/5 p-3 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
                            <div>
                              <p className="text-sm text-white/90 font-medium leading-tight">{award.category}</p>
                              <p className="text-xs text-white/40 mt-1 font-bold">{award.year}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      <Pagination
        totalItems={filteredData.length}
        itemsPerPage={itemsPerPage}
        currentPage={currentPage}
        onPageChange={handlePageChange}
        onItemsPerPageChange={handleItemsPerPageChange}
        isMobile={isMobile}
        itemsText="Games"
      />
    </motion.div>
  );
};

export default Leaderboard;
