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
      <div className="w-5/6 mx-auto flex flex-col gap-8">
        <h2 className="text-2xl font-bold text-center">Calendars</h2>
        <div className="w-full flex justify-center">
          <div className="border-primary rounded-xl">
            <div className="flex flex-row gap-4 items-center justify-center p-2 rounded-md">
              <button
              className={`w-fit px-2 py-1.5 sm:px-3 sm:py-2 rounded-md text-sm sm:text-base
                ${seeGames ? 'bg-gradient-primary' : ''}`}
              onClick={() => setView('games')}
              disabled={seeGames}
            >
              Games
            </button>
            <button
              className={`w-fit px-2 py-1.5 sm:px-3 sm:py-2 rounded-md text-sm sm:text-base
                ${seeEvents ? 'bg-gradient-primary' : ''}`}
              onClick={() => setView('events')}
              disabled={seeEvents}
            >
              Events
            </button>
            </div>
          </div>
        </div>
        <div className="w-full flex flex-col justify-between">
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