import { useEffect, useState, useRef, useMemo } from "react";
import { FaChevronLeft, FaChevronRight, FaCalendarDay, FaGamepad, FaVideo, FaInfoCircle } from 'react-icons/fa';
import { motion, AnimatePresence } from "framer-motion";
import { useGameUI } from "../../contexts/GameUIContext";
import { useGameData } from "../../contexts/GameDataContext";
import { fetchMergedEvents } from "../../js/events";
import Modal from "../modals/Modal";
import EventLogoSkeleton from "../skeletons/EventLogoSkeleton";
import { useNavigate } from "react-router-dom";
import { slugify } from "../../js/utils";

const Calendar = ({ mode = "games" }) => {
  const [currentMonthStart, setCurrentMonthStart] = useState(getMonthStart(new Date()));
  const [firstFutureMonthStart, setFirstFutureMonthStart] = useState(null);
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loadedImage, setLoadedImage] = useState(false);
  const initialMonthRef = useRef(getMonthStart(new Date()));
  const { isMobile } = useGameUI();
  const { games } = useGameData();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      let rawData = [];
      if (mode === "games") {
        rawData = games
          .filter((game) => game.release_date?.seconds)
          .map((game) => ({
            id: game.id || game.name,
            title: game.name,
            jsDate: new Date(game.release_date.seconds * 1000),
            type: 'game',
            ...game
          }));
      } else {
        const events = await fetchMergedEvents();
        rawData = events.map(event => ({
          id: event.id || event.title,
          title: event.title,
          jsDate: new Date(event.start),
          type: 'event',
          ...event
        }));
      }

      setItems(rawData);

      const today = new Date();
      const futureItem = rawData.find(item => item.jsDate >= today);
      const futureMonthStart = futureItem ? getMonthStart(futureItem.jsDate) : null;
      setFirstFutureMonthStart(futureMonthStart);
    };

    fetchData();
  }, [games, mode]);

  // Group items by YYYY-MM-DD for O(1) lookup
  const groupedItems = useMemo(() => {
    const map = {};
    items.forEach(item => {
      const key = formatDateToYYYYMMDD(item.jsDate);
      if (!map[key]) map[key] = [];
      map[key].push(item);
    });
    return map;
  }, [items]);

  function getMonthStart(date) {
    const d = new Date(date);
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function formatDateToYYYYMMDD(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function isoMonth(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  }

  function addMonths(date, count) {
    const d = new Date(date);
    d.setMonth(d.getMonth() + count);
    return getMonthStart(d);
  }

  const weeks = useMemo(() => {
    const start = new Date(currentMonthStart);
    const dayOfweek = start.getDay() || 7;
    start.setDate(start.getDate() - (dayOfweek - 1));

    const end = new Date(currentMonthStart);
    end.setMonth(end.getMonth() + 1);
    end.setDate(0);
    const endDayOfWeek = end.getDay() || 7;
    end.setDate(end.getDate() + (7 - endDayOfWeek));

    const res = [];
    let current = new Date(start);
    while (current <= end) {
      const week = [];
      for (let i = 0; i < 7; i++) {
        week.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }
      res.push(week);
    }
    return res;
  }, [currentMonthStart]);

  const shiftMonth = (offset) => {
    setCurrentMonthStart(prev => addMonths(prev, offset));
  };

  const handleItemClick = (e, item) => {
    e.stopPropagation();
    if (item.type === "event") {
      setSelectedItem(item);
      setLoadedImage(false);
    } else {
      navigate(`/games/${slugify(item.title)}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 py-6 sm:py-8 text-white min-h-screen">
      <div className="flex flex-col md:flex-row gap-4 sm:gap-6 items-center justify-between mb-8 sm:mb-12 bg-white/5 backdrop-blur-xl border border-white/10 p-4 sm:p-6 rounded-3xl sm:rounded-[2rem] shadow-2xl">
        <div className="flex items-center gap-4 sm:gap-6 w-full md:w-auto justify-between md:justify-start">
          <div className="flex bg-black/20 p-1 rounded-xl sm:rounded-2xl border border-white/5 items-center">
            <button onClick={() => shiftMonth(-1)} className="p-2 sm:p-3 hover:bg-white/10 rounded-lg sm:rounded-xl transition-all">
              <FaChevronLeft className="text-white/60 text-xs sm:text-base" />
            </button>
            <div className="px-2 sm:px-6 flex flex-col items-center justify-center min-w-[120px] sm:min-w-[180px]">
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-[#5a8eff] mb-0.5">
                {currentMonthStart.getFullYear()}
              </span>
              <h2 className="text-base sm:text-xl font-black whitespace-nowrap">
                {currentMonthStart.toLocaleString("en-US", { month: "long" })}
              </h2>
            </div>
            <button onClick={() => shiftMonth(1)} className="p-2 sm:p-3 hover:bg-white/10 rounded-lg sm:rounded-xl transition-all">
              <FaChevronRight className="text-white/60 text-xs sm:text-base" />
            </button>
          </div>

          <div className="hidden lg:flex items-center gap-2">
            <input
              type="month"
              className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5a8eff]/50 transition-all font-bold"
              value={isoMonth(currentMonthStart)}
              onChange={(e) => {
                const [year, month] = e.target.value.split("-");
                if (year && month) setCurrentMonthStart(new Date(year, month - 1, 1));
              }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 w-full md:w-auto justify-center md:justify-end">
          <button
            onClick={() => setCurrentMonthStart(initialMonthRef.current)}
            className={`flex-1 md:flex-none px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-wider transition-all border ${isoMonth(currentMonthStart) === isoMonth(initialMonthRef.current)
              ? "bg-white/10 border-white/20 text-white/40 cursor-default"
              : "bg-[#5a8eff] border-[#5a8eff] hover:shadow-[0_0_20px_rgba(90,142,255,0.4)] active:scale-95 text-white"
              }`}
          >
            Today
          </button>
          {firstFutureMonthStart && isoMonth(currentMonthStart) !== isoMonth(firstFutureMonthStart) && (
            <button
              onClick={() => setCurrentMonthStart(firstFutureMonthStart)}
              className="flex-1 md:flex-none px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 font-black text-[10px] sm:text-xs uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <FaCalendarDay className="text-[#ffd788]" />
              <span className="whitespace-nowrap">{mode === "games" ? "Next Release" : "Next Event"}</span>
            </button>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={isoMonth(currentMonthStart)}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          {isMobile ? (
            <div className="space-y-4">
              {weeks.flat().filter(d => d.getMonth() === currentMonthStart.getMonth()).map((day) => {
                const dayKey = formatDateToYYYYMMDD(day);
                const dayItems = groupedItems[dayKey] || [];
                const isToday = dayKey === formatDateToYYYYMMDD(new Date());

                if (dayItems.length === 0 && !isToday) return null;

                return (
                  <div key={dayKey} className={`group bg-white/5 backdrop-blur-lg border ${isToday ? 'border-[#5a8eff]/40 bg-[#5a8eff]/5' : 'border-white/10'} p-4 rounded-3xl transition-all`}>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${isToday ? 'text-[#5a8eff]' : 'text-white/40'}`}>
                          {day.toLocaleDateString("en-US", { weekday: "long" })}
                        </span>
                        <h3 className="text-lg font-black">{day.getDate()} {day.toLocaleDateString("en-US", { month: "short" })}</h3>
                      </div>
                      {isToday && <span className="bg-[#5a8eff] text-white text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-tighter shadow-lg">Today</span>}
                    </div>
                    <div className="space-y-2">
                      {dayItems.map(item => (
                        <div
                          key={item.id}
                          onClick={(e) => handleItemClick(e, item)}
                          className={`flex items-center gap-3 p-3 rounded-2xl border border-white/5 transition-all active:scale-[0.98] ${item.type === 'event' ? 'bg-gradient-tertiary/20 hover:bg-gradient-tertiary/30' : 'bg-white/5 hover:bg-white/10'
                            }`}
                        >
                          <div className={`size-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${item.type === 'event' ? 'bg-orange-500/20 text-[#ffd788]' : 'bg-[#5a8eff]/20 text-[#5a8eff]'
                            }`}>
                            {item.type === 'event' ? <FaVideo /> : <FaGamepad />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-sm truncate">{item.title}</h4>
                            <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">
                              {item.type === 'event' ? 'Industry Event' : 'Game Release'}
                            </p>
                          </div>
                          <FaChevronRight className="text-white/20 text-xs" />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-px bg-white/10 border border-white/10 rounded-xl overflow-hidden shadow-2xl backdrop-blur-sm">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => (
                <div key={d} className="bg-black/40 py-4 text-center text-[10px] font-black uppercase tracking-[0.2em] text-white/40 border-b border-white/10">
                  {d}
                </div>
              ))}
              {weeks.flat().map((day, idx) => {
                const dayKey = formatDateToYYYYMMDD(day);
                const dayItems = groupedItems[dayKey] || [];
                const isCurrentMonth = day.getMonth() === currentMonthStart.getMonth();
                const isToday = dayKey === formatDateToYYYYMMDD(new Date());

                return (
                  <div
                    key={dayKey}
                    className={`min-h-[160px] p-3 transition-colors ${isCurrentMonth ? "bg-white/[0.02]" : "bg-black/40 opacity-30"
                      } ${isToday ? "bg-[#5a8eff]/10 ring-1 ring-inset ring-[#5a8eff]/80" : ""}`}
                  >
                    <div className="flex justify-between items-center mb-3">
                      <span className={`text-xs font-black ${isToday ? "text-[#5a8eff]" : "text-white/40"}`}>
                        {day.getDate()}
                      </span>
                      {isToday && <div className="size-1.5 rounded-full bg-[#5a8eff] shadow-[0_0_10px_#5a8eff]" />}
                    </div>

                    <div className="space-y-1.5 custom-scrollbar max-h-[120px] overflow-y-auto pr-1">
                      {dayItems.map(item => (
                        <motion.div
                          layoutId={item.id}
                          key={item.id}
                          onClick={(e) => handleItemClick(e, item)}
                          className={`group cursor-pointer p-2 rounded-lg border border-white/5 transition-all ${item.type === 'event'
                            ? 'bg-[#ffd788]/10 hover:bg-[#ffd788]/20 hover:border-[#ffd788]/30'
                            : 'bg-white/5 hover:bg-white/10 hover:border-white/20'
                            }`}
                        >
                          <div className="flex items-start gap-2 text-ellipsis overflow-hidden whitespace-nowrap">
                            <span className="text-[10px] font-bold leading-tight group-hover:text-white transition-colors">
                              {item.title}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {selectedItem && (
          <Modal
            title={selectedItem.title}
            onClose={() => {
              setSelectedItem(null);
              setLoadedImage(false);
            }}
          >
            <div className="flex flex-col gap-6">
              {selectedItem.logo && (
                <div className="w-full aspect-video overflow-hidden flex justify-center relative bg-black/40 rounded-2xl border border-white/10 group">
                  {selectedItem.streamUrl ? (
                    <iframe
                      src={selectedItem.streamUrl.replace("watch?v=", "embed/")}
                      className="w-full h-full rounded-2xl"
                      title={selectedItem.title}
                      allowFullScreen
                    />
                  ) : (
                    <>
                      {!loadedImage && <EventLogoSkeleton />}
                      <img
                        src={selectedItem.logo}
                        alt={selectedItem.title}
                        className={`w-full h-full object-cover transition-all duration-700 ${loadedImage ? "scale-100 opacity-100" : "scale-110 opacity-0 absolute"
                          }`}
                        onLoad={() => setLoadedImage(true)}
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </>
                  )}
                </div>
              )}

              <div className="space-y-6">
                {selectedItem.description && (
                  <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                    <div className="flex items-center gap-2 mb-2 text-[#5a8eff]">
                      <FaInfoCircle className="text-xs" />
                      <h3 className="text-[10px] font-black uppercase tracking-widest">Description</h3>
                    </div>
                    <p className="text-sm text-white/70 leading-relaxed max-h-[200px] overflow-y-auto custom-scrollbar pr-2 whitespace-pre-line">
                      {selectedItem.description}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex gap-4 items-center">
                    <div className="size-10 rounded-lg bg-[#5a8eff]/20 flex items-center justify-center text-[#5a8eff]">
                      <FaCalendarDay />
                    </div>
                    <div>
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-0.5">Starts</h3>
                      <p className="text-sm font-bold">
                        {selectedItem.jsDate.toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </p>
                    </div>
                  </div>

                  {selectedItem.end && (
                    <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex gap-4 items-center">
                      <div className="size-10 rounded-lg bg-orange-500/20 flex items-center justify-center text-orange-400">
                        <FaVideo />
                      </div>
                      <div>
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-0.5">Ends</h3>
                        <p className="text-sm font-bold">
                          {new Date(selectedItem.end).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}</style>
    </div>
  );
};

export default Calendar;
