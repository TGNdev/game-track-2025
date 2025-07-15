import { useEffect, useState, useRef } from "react";
import { getGamesFromFirestore } from "../../js/firebase";
import GamePreviewModal from "../games/GamePreviewModal";
import { getGameCovers } from "../../js/igdb";
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';

const Games = () => {
  const [games, setGames] = useState([]);
  const [currentMonthStart, setCurrentMonthStart] = useState(getMonthStart(new Date()));
  const [firstFutureMonthStart, setFirstFutureMonthStart] = useState(null);
  const initialMonthRef = useRef(null);
  const [previewGame, setPreviewGame] = useState(null);
  const [previewBounds, setPreviewBounds] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [coverMap, setCoverMap] = useState(null);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const gamesList = await getGamesFromFirestore();

        const datedGames = gamesList
          .filter(
            (game) =>
              game.release_date &&
              typeof game.release_date === "object" &&
              game.release_date.seconds
          )
          .map((game) => ({
            ...game,
            jsDate: new Date(game.release_date.seconds * 1000),
          }));

        setGames(datedGames);

        const today = new Date();
        const futureGame = datedGames.find(game => game.jsDate >= today);

        const futureMonthStart = futureGame ? getMonthStart(futureGame.jsDate) : null;

        initialMonthRef.current = getMonthStart(today);
        setCurrentMonthStart(getMonthStart(today));
        setFirstFutureMonthStart(futureMonthStart);
      } catch (error) {
        console.error("Error fetching games:", error);
      }
    };

    fetchGames();
  }, []);

  useEffect(() => {
    const fetchCovers = async () => {
      if (games.length === 0) return;
      const gameIds = games.map((g) => g.igdb_id);
      const covers = await getGameCovers(gameIds);
      setCoverMap(covers);
    };
    fetchCovers();
  }, [games, setCoverMap]);

  function getMonthStart(date) {
    const d = new Date(date);
    d.setDate(1);
    d.setHours(0, 0, 0, 0);

    return d;
  }

  function isoMonth(date) {
    return date.toISOString().slice(0, 7);
  }

  function addMonths(date, count) {
    const d = new Date(date);
    d.setMonth(d.getMonth() + count);
    return getMonthStart(d);
  }

  function daysInMonth(date) {
    const year = date.getFullYear();
    const month = date.getMonth();

    return new Date(year, month + 1, 0).getDate();
  }

  function getWeekday(date) {
    let day = date.getDay();
    if (day === 0) day = 7;

    return day;
  }

  function getStartOfWeek(date) {
    const d = new Date(date);
    const day = getWeekday(d);
    d.setDate(d.getDate() - (day - 1));
    d.setHours(0, 0, 0, 0);
    return d;
  }
  const monthStart = currentMonthStart;
  const calendarStart = getStartOfWeek(monthStart);
  const lastDay = daysInMonth(monthStart);
  const monthEnd = new Date(monthStart);
  monthEnd.setDate(lastDay);

  let calendarEnd = new Date(monthEnd);
  const lastWeekday = getWeekday(calendarEnd);
  calendarEnd.setDate(calendarEnd.getDate() + (7 - lastWeekday));
  calendarEnd.setHours(23, 59, 59, 999);

  const weeks = [];
  let currentDay = new Date(calendarStart);

  while (currentDay <= calendarEnd) {
    const week = [];
    for (let i = 0; i < 7; i++) {
      week.push(new Date(currentDay));
      currentDay.setDate(currentDay.getDate() + 1);
    }
    weeks.push(week);
  }

  function shiftMonth(offset) {
    setCurrentMonthStart(addMonths(currentMonthStart, offset));
  }

  return (
    <div className="p-4">
      {/* Navigation Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2">
        <div className="flex flex-row justify-between w-full gap-3">
          <div className="flex flex-row gap-2 items-center">
            <div>Go to</div>
            <input
              type="month"
              className="border px-2 py-1 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={isoMonth(currentMonthStart)}
              onChange={(e) => {
                const [year, month] = e.target.value.split("-");
                if (!year || !month) return;
                setCurrentMonthStart(new Date(year, month - 1, 1));
              }}
              aria-label="Jump to month"
            />
          </div>
          <div className="flex flex-row gap-2">
            {initialMonthRef.current && isoMonth(currentMonthStart) !== isoMonth(initialMonthRef.current) && (
              <button
                onClick={() => setCurrentMonthStart(initialMonthRef.current)}
                className="bg-gradient-primary rounded-md px-2 py-1 flex hover:scale-110 transition"
              >
                Today
              </button>
            )}
            {firstFutureMonthStart && isoMonth(currentMonthStart) !== isoMonth(firstFutureMonthStart) && (
              <button
                onClick={() => setCurrentMonthStart(firstFutureMonthStart)}
                className="bg-gradient-primary rounded-md px-2 py-1 flex hover:scale-110 transition"
              >
                Next Release
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Header + Navigation */}
      <div className="flex flex-row justify-between items-center mb-4">
        <button
          onClick={() => shiftMonth(-1)}
          className="text-sm px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
        >
          <FaArrowLeft />
        </button>

        <h2 className="text-xl font-bold">
          {monthStart.toLocaleString("en-US", { month: "long" })} {monthStart.getFullYear()}
        </h2>

        <button
          onClick={() => shiftMonth(1)}
          className="text-sm px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
        >
          <FaArrowRight />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 text-center font-medium mb-2">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      {/* Calendar weeks */}
      <div>
        {weeks.map((week, idx) => (
          <div key={idx} className="flex flex-row">
            {week.map((day) => {
              const dayStr = day.toISOString().slice(0, 10);
              const isCurrentMonth = day.getMonth() === monthStart.getMonth();

              const dayGames = games.filter(
                (game) => game.jsDate.toISOString().slice(0, 10) === dayStr
              );

              return (
                <div
                  key={dayStr}
                  className={`border p-2 h-32 w-full md:h-40 overflow-y-auto text-sm ${isCurrentMonth ? "bg-white" : "bg-gray-100 text-gray-400"
                    }`}
                >
                  <div className="text-xs font-bold">{day.getDate()}</div>
                  <ul className="mt-1 space-y-1">
                    {dayGames.map((game, idx) => (
                      <button
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setPreviewGame({
                            ...game,
                            cover: coverMap[game.igdb_id],
                          });
                          setPreviewBounds({ top: rect.top + window.scrollY, left: rect.left + window.scrollX });
                          setShowPreview(true);
                        }}
                        className="font-bold text-left w-full hover:scale-105 transition"
                      >
                        <li
                          key={idx}
                          className="bg-gradient-primary rounded px-1 py-0.5"
                        >
                          {game.name}
                        </li>
                      </button>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <GamePreviewModal
        game={previewGame}
        bounds={previewBounds}
        isVisible={showPreview}
        onClose={() => setShowPreview(false)}
      />
    </div>
  );
};

export default Games;
