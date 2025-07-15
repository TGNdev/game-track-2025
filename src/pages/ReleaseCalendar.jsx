import Layout from "../components/shared/Layout";
import Events from "../components/calendar/Events";
import Games from "../components/calendar/Games";
import { useState } from "react";

const ReleaseCalendar = () => {
  const [view, setView] = useState('games');
  const seeGames = view === 'games';
  const seeEvents = view === 'events';

  return (
    <Layout>
      <div className="flex flex-col gap-8">
        <h2 className="text-2xl font-bold text-center">Calendars</h2>
        <div className="w-full flex justify-center">
          <div className="flex flex-row w-full gap-4 items-center justify-center">
            <button
              className={`${seeGames && "bg-gradient-primary text-white"} disabled:opacity-80 disabled:hover:bg-gradient-primary hover:bg-slate-200 w-fit px-2 py-1.5 sm:px-3 sm:py-2 border rounded-md text-sm sm:text-base transition`}
              onClick={() => setView('games')}
              disabled={!seeGames}
            >
              Games
            </button>
            <button
              className={`${seeEvents && "bg-gradient-primary text-white"} disabled:opacity-80 disabled:hover:bg-gradient-primary hover:bg-slate-200 w-fit px-2 py-1.5 sm:px-3 sm:py-2 border rounded-md text-sm sm:text-base transition`}
              onClick={() => setView('events')}
              disabled={!seeEvents}
            >
              Events
            </button>
          </div>
        </div>
        <div className="w-full sm:w-4/5 mx-auto flex flex-col justify-between">
          {seeGames ? (
            <Games />
          ) : seeEvents ? (
            <Events />
          ) : (
            <div></div>
          )}
        </div>
      </div>
    </Layout>
  )
}

export default ReleaseCalendar;