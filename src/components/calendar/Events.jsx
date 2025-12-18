import { useState, useEffect, useRef } from 'react';
import { fetchMergedEvents } from '../../js/events';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import { useGame } from '../../contexts/GameContext';
import { highlightMatch } from '../../js/utils';

const Events = () => {
  const [allEvents, setAllEvents] = useState([]);
  const [currentWeekStart, setCurrentWeekStart] = useState(null);
  const [todayWeekStart] = useState(getStartOfWeek(new Date()));
  const [firstFutureWeekStart, setFirstFutureWeekStart] = useState(null);
  const initialWeekStartRef = useRef(null);
  const {
    search,
  } = useGame();

  useEffect(() => {
    fetchMergedEvents()
      .then(events => {
        events.sort((a, b) => new Date(a.start) - new Date(b.start));
        setAllEvents(events);

        const today = new Date();
        const futureEvent = events.find(e => new Date(e.start) >= today);

        let initialDate;
        let initialWeekStart;
        if (futureEvent) {
          initialDate = new Date(futureEvent.start);
          initialWeekStart = getStartOfWeek(initialDate);
          setFirstFutureWeekStart(initialWeekStart);
        } else {
          initialDate = today;
          initialWeekStart = getStartOfWeek(today);
          setFirstFutureWeekStart(null);
        }

        setCurrentWeekStart(initialWeekStart);
        initialWeekStartRef.current = initialWeekStart;
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!allEvents.length || !initialWeekStartRef.current) return;

    if (!search.trim()) {
      setCurrentWeekStart(initialWeekStartRef.current);
      return;
    }

    const match = allEvents.find(e =>
      e.title.toLowerCase().includes(search.toLowerCase())
    );

    if (match) {
      const matchDate = new Date(match.start);
      setCurrentWeekStart(getStartOfWeek(matchDate));
    }
  }, [search, allEvents]);


  if (!currentWeekStart) return <div>Loading events...</div>;

  const currentWeekEnd = new Date(currentWeekStart);
  currentWeekEnd.setDate(currentWeekEnd.getDate() + 6);

  const eventsThisWeek = allEvents.filter(event => {
    const eventDate = new Date(event.start);
    const localDate = new Date(
      eventDate.getFullYear(),
      eventDate.getMonth(),
      eventDate.getDate()
    );
    return localDate >= currentWeekStart && localDate <= currentWeekEnd;
  });

  const groupedByDay = eventsThisWeek.reduce((acc, event) => {
    const dateKey = new Date(event.start).toLocaleDateString('en-US');
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(event);
    return acc;
  }, {});

  const sortedDays = Object.keys(groupedByDay).sort((a, b) => new Date(a) - new Date(b));

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2">
        <div className='flex flex-row justify-between w-full gap-3'>
          <div className='flex flex-row gap-2 items-center'>
            <div>Go to</div>
            <input
              type="date"
              className="border px-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 h-full"
              value={currentWeekStart.toISOString().slice(0, 10)}
              onChange={e => {
                const selectedDate = new Date(e.target.value);
                if (!isNaN(selectedDate)) {
                  setCurrentWeekStart(getStartOfWeek(selectedDate));
                }
              }}
              aria-label="Jump to week by date"
            />
          </div>
          <div className='flex flex-row gap-2'>
            {currentWeekStart.getTime() !== todayWeekStart.getTime() && (
              <button
                onClick={() => setCurrentWeekStart(todayWeekStart)}
                className="p-2 bg-gradient-primary rounded-md text-sm sm:text-base"
              >
                Today
              </button>
            )}
            {firstFutureWeekStart && currentWeekStart.getTime() !== firstFutureWeekStart.getTime() && (
              <button
                onClick={() => setCurrentWeekStart(firstFutureWeekStart)}
                className="p-2 bg-gradient-primary rounded-md text-sm sm:text-base"
              >
                Next Event
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="flex flex-row justify-between items-center mb-8 gap-2">
        <div className="flex-1" />
        <h1 className="sm:text-xl font-bold text-center absolute left-1/2 transform -translate-x-1/2">
          {formatWeekRange(currentWeekStart)}
        </h1>

        <div className="flex flex-row gap-2 text-xs sm:text-base">
          <button
            onClick={() => shiftWeek(-1)}
            className="p-2 bg-gradient-primary rounded-md"
            aria-label="Previous week"
          >
            <FaArrowLeft />
          </button>

          <button
            onClick={() => shiftWeek(1)}
            className="p-2 bg-gradient-primary rounded-md"
            aria-label="Next week"
          >
            <FaArrowRight />
          </button>
        </div>
      </div>
      {eventsThisWeek.length === 0 ? (
        <div className="text-gray-500 text-center p-20 border rounded-md bg-slate-100">No events this week</div>
      ) : (
        sortedDays.map(date => (
          <div key={date} className="mb-6">
            <h2 className="text-lg font-semibold mb-2">{formatDate(date)}</h2>
            <ul className="space-y-2">
              {groupedByDay[date].map((event, i) => (
                <li
                  key={i}
                  className={`p-3 border rounded shadow-md ${i % 2 === 1 ? 'bg-slate-100' : ''}`}
                >
                  <div className='flex flex-row justify-between items-center gap-2'>
                    <div className='flex flex-col gap-1'>
                      <p className="font-medium">
                        {highlightMatch(event.title, search)}
                      </p>
                      <p className='text-xs'>{event.description}</p>
                      <div className="flex flex-row gap-4 items-center text-sm text-gray-600">
                        <div>{formatTimeRange(event.start, event.end)}</div>
                        <div className='text-xs italic text-slate-400'>({formatDuration(event.duration)})</div>
                      </div>
                    </div>
                    {event.source === 'ical' && (
                      <>
                        <div className='bg-blue-100 text-blue-500 rounded-md h-fit text-sm px-2 py-1 italic hidden sm:block text-center'>
                          Official SGF Calendar
                        </div>
                        <div className='bg-blue-100 text-blue-500 rounded-md h-fit text-xs px-2 py-1 italic block sm:hidden text-center'>
                          SGF Cal.
                        </div>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </>
  );

  function shiftWeek(offset) {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() + offset * 7);
    setCurrentWeekStart(newStart);
  }
};

function getStartOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDate(date) {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDuration(duration) {
  if (!duration) return '';
  const hours = duration.hours || 0;
  const minutes = duration.minutes || 0;
  let result = '';
  if (hours > 0) result += `${hours}h`;
  if (minutes > 0) result += `${minutes}min`;
  if (!result) result = '0min';
  return result;
}

function formatTimeRange(start, end) {
  const startDate = new Date(start);
  const endDate = end ? new Date(end) : null;
  const opts = { hour: '2-digit', minute: '2-digit' };
  const startStr = startDate.toLocaleTimeString(undefined, opts);
  const endStr = endDate ? endDate.toLocaleTimeString(undefined, opts) : '';
  return endStr ? `${startStr} – ${endStr}` : startStr;
}

function formatWeekRange(startDate) {
  const start = new Date(startDate);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);

  const sameYear = start.getFullYear() === end.getFullYear();

  const options = { month: 'short', day: 'numeric' };
  const startStr = start.toLocaleDateString('en-US', options);
  const endStr = end.toLocaleDateString('en-US', {
    ...options,
    year: sameYear ? undefined : 'numeric',
  });

  const yearSuffix = sameYear ? start.getFullYear() : '';

  return `${startStr} – ${endStr}${yearSuffix ? `, ${yearSuffix}` : ''}`;
}

export default Events;
