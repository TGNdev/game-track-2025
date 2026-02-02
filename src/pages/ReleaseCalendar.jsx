import Layout from "../components/shared/Layout";
import Calendar from "../components/calendar/Calendar";
import { useState } from "react";
import { FaCalendar } from "react-icons/fa";

const ReleaseCalendar = () => {
  const [view, setView] = useState('games');
  const seeGames = view === 'games';
  const seeEvents = view === 'events';

  return (
    <Layout>
      <div className="max-w-[1400px] mx-auto px-6 pb-12 md:py-20 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-primary-light">
              <div className="size-10 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-[0_0_20px_rgba(176,105,255,0.4)]">
                <FaCalendar size={24} className="text-white" />
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
                Calendars
              </h1>
            </div>
            <p className="text-white/40 font-medium max-w-xl text-lg leading-relaxed">
              Track upcoming game releases and gaming events, served to you in a clean and organized way.
            </p>
          </div>
        </div>
        <div className="w-full flex justify-center">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-1 shadow-2xl relative overflow-hidden">
            <div className="flex flex-row gap-4 items-center justify-center p-2 rounded-md">
              <button
                className={`${seeGames && "bg-gradient-primary"} disabled:scale-100 w-fit px-2 py-1.5 sm:px-3 sm:py-2 rounded-md text-sm sm:text-base`}
                onClick={() => setView('games')}
                disabled={seeGames}
              >
                Games
              </button>
              <button
                className={`${seeEvents && "bg-gradient-primary"} disabled:scale-100 w-fit px-2 py-1.5 sm:px-3 sm:py-2 rounded-md text-sm sm:text-base`}
                onClick={() => setView('events')}
                disabled={seeEvents}
              >
                Events
              </button>
            </div>
          </div>
        </div>
        <div className="w-full flex flex-col justify-between">
          <Calendar mode={view} />
        </div>
      </div>
    </Layout>
  )
}

export default ReleaseCalendar;