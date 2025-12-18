import { useEffect, useState, useRef } from "react";
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import { useGame } from "../../contexts/GameContext";

const Games = () => {
  const [currentMonthStart, setCurrentMonthStart] = useState(getMonthStart(new Date()));
  const [firstFutureMonthStart, setFirstFutureMonthStart] = useState(null);
  const [datedGames, setDatedGames] = useState([]);
  const initialMonthRef = useRef(null);
  const {
    games,
    isMobile
  } = useGame();

  useEffect(() => {
    const fetchGames = async () => {
      const processedGames = games
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

      setDatedGames(processedGames);

      const today = new Date();
      const futureGame = processedGames.find(game => game.jsDate >= today);

      const futureMonthStart = futureGame ? getMonthStart(futureGame.jsDate) : null;

      initialMonthRef.current = getMonthStart(today);
      setCurrentMonthStart(getMonthStart(today));
      setFirstFutureMonthStart(futureMonthStart);
    };

    fetchGames();
  }, [games]);

  function getMonthStart(date) {
    const d = new Date(date);
    d.setDate(1);
    d.setHours(0, 0, 0, 0);

    return d;
  }

  function isoMonth(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
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

  function formatDateToYYYYMMDD(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
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
              className="border px-2 py-1 rounded-md text-sm bg-background"
              value={isoMonth(currentMonthStart)}
              onChange={(e) => {
                const [year, month] = e.target.value.split("-");
                if (!year || !month) return;
                const newDate = new Date(year, month - 1, 1);
                setCurrentMonthStart(getMonthStart(newDate));
              }}
              aria-label="Jump to month"
              lang="en-US"
            />
          </div>
          <div className="flex flex-row gap-2">
            {initialMonthRef.current && isoMonth(currentMonthStart) !== isoMonth(initialMonthRef.current) && (
              <button
                onClick={() => setCurrentMonthStart(initialMonthRef.current)}
                className="bg-gradient-primary rounded-md px-2 py-1 flex"
              >
                Today
              </button>
            )}
            {firstFutureMonthStart && isoMonth(currentMonthStart) !== isoMonth(firstFutureMonthStart) && (
              <button
                onClick={() => setCurrentMonthStart(firstFutureMonthStart)}
                className="bg-gradient-primary rounded-md px-2 py-1 flex"
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
          className="text-sm px-3 py-1 rounded bg-gradient-primary"
        >
          <FaArrowLeft />
        </button>

        <h2 className="text-xl font-bold">
          {monthStart.toLocaleString("en-US", { month: "long" })} {monthStart.getFullYear()}
        </h2>

        <button
          onClick={() => shiftMonth(1)}
          className="text-sm px-3 py-1 bg-gradient-primary rounded"
        >
          <FaArrowRight />
        </button>
      </div>

      {isMobile ? (
        <div>
          {weeks.flat().filter((day) => day.getMonth() === monthStart.getMonth()).map((day) => {
            const dayStr = formatDateToYYYYMMDD(day);
            const isCurrentMonth = day.getMonth() === monthStart.getMonth();
            const isToday = dayStr === new Date().toISOString().slice(0, 10);

            const dayGames = datedGames.filter(
              (game) => formatDateToYYYYMMDD(game.jsDate) === dayStr
            );

            return (
              <div
                key={dayStr}
                className={`p-2 mb-2 rounded-md ${isToday ? "bg-gradient-tertiary" : "border"} ${!isCurrentMonth ? "bg-black/30 text-gray-400" : ""}`}
              >
                <div className="text-sm font-bold mb-1">
                  {day.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
                </div>
                <ul className="space-y-1">
                  {dayGames.map((game, idx) => (
                    <div
                      key={idx}
                      className="font-bold text-left w-full"
                    >
                      <li
                        key={idx}
                        className="bg-gradient-primary rounded px-1 py-0.5"
                      >
                        {game.name}
                      </li>
                    </div>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      ) : (
        <>
          {/* Weekday headers */}
          <table className="w-full border-collapse border table-fixed">
            <thead>
              <tr className="text-center font-medium">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                  <th key={d} className="border border-gray-200 p-2">{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Calendar weeks */}
              {weeks.map((week, idx) => (
                <tr key={idx}>
                  {week.map((day) => {
                    const dayStr = formatDateToYYYYMMDD(day);
                    const isCurrentMonth = day.getMonth() === monthStart.getMonth();
                    const isToday = dayStr === new Date().toISOString().slice(0, 10);

                    const dayGames = datedGames.filter(
                      (game) => formatDateToYYYYMMDD(game.jsDate) === dayStr
                    );

                    return (
                      <td
                        key={dayStr}
                        className={`border border-gray-200 p-2 h-32 md:h-40 text-sm ${isToday ? "bg-gradient-tertiary" : ""} ${isCurrentMonth ? "" : "bg-black/30 text-gray-300"}`}
                      >
                        <div className="text-xs font-bold">{day.getDate()}</div>
                        <ul className="space-y-2 h-full overflow-y-auto">
                          {dayGames.map((game, idx) => (
                            <div
                              key={idx}
                              className="font-bold text-left w-full"
                            >
                              <li
                                key={idx}
                                className="bg-gradient-primary rounded px-1 py-0.5 text-ellipsis overflow-hidden whitespace-pre-line"
                                title={game.name}
                              >
                                {game.name}
                              </li>
                            </div>
                          ))}
                        </ul>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};

export default Games;
