import { useAuth } from "../contexts/AuthContext";
import { useGameData } from "../contexts/GameDataContext";
import Layout from "../components/shared/Layout";
import { Navigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { getGameCovers } from "../js/igdb";
import { useNavigate } from "react-router-dom";
import { slugify } from "../js/utils";
import { FaExternalLinkAlt, FaClock, FaPlus, FaCheck } from "react-icons/fa";
import { removeFromLibrary, removeCountdown } from "../js/firebase";
import { toast } from "react-toastify";
import CountdownTimer from "../components/shared/CountdownTimer";

const Profile = () => {
  const navigate = useNavigate();
  const { userData, currentUser } = useAuth();
  const { games, coverMap, setCoverMap } = useGameData();
  const [view, setView] = useState('played');

  const isPlayedView = view === 'played';

  const playedGames = useMemo(() => {
    if (!userData?.library?.played || games.length === 0) return [];
    return games
      .filter(g => userData.library.played.includes(g.id))
      .sort((a, b) => (b.release_date?.seconds || 0) - (a.release_date?.seconds || 0));
  }, [userData?.library?.played, games]);

  const toPlayGames = useMemo(() => {
    if (!userData?.library?.toPlay || games.length === 0) return [];
    return games
      .filter(g => userData.library.toPlay.includes(g.id))
      .sort((a, b) => (b.release_date?.seconds || 0) - (a.release_date?.seconds || 0));
  }, [userData?.library?.toPlay, games]);

  const handleRemoveFromLibrary = (gameId, type) => {
    removeFromLibrary(currentUser.uid, gameId, type);
    toast.success("Library updated !");
  };

  const countdowns = useMemo(() => {
    if (!userData?.wanted || games.length === 0) return [];
    return games
      .filter(g => userData.wanted.includes(g.id))
      .sort((a, b) => (a.release_date?.seconds || Infinity) - (b.release_date?.seconds || Infinity));
  }, [userData?.wanted, games]);

  const handleRemoveCountdown = (gameId) => {
    removeCountdown(currentUser.uid, gameId);
    toast.success("Countdown removed !");
  };

  useEffect(() => {
    const allGamesWithCovers = [...playedGames, ...toPlayGames, ...countdowns];
    if (allGamesWithCovers.length > 0) {
      const fetchCovers = async () => {
        const gameIds = allGamesWithCovers.map((g) => g.igdb_id);
        const covers = await getGameCovers(gameIds);
        setCoverMap(covers);
      };
      fetchCovers();
    }
  }, [playedGames, toPlayGames, countdowns, setCoverMap]);

  if (!currentUser) return <Navigate to="/" />;

  return (
    <Layout>
      <div className="mx-6 mt-6 flex flex-col gap-12 md:gap-20">
        <section className="flex flex-col items-center md:items-start gap-4">
          <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
            {userData?.username || 'Gamer'}
          </h1>
          <p className="text-white/40 font-bold uppercase tracking-widest text-xs md:text-sm">Personal Library</p>
        </section>

        <section>
          <div className="flex flex-col gap-6">
            <div className="w-full flex justify-center">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-1 shadow-2xl relative overflow-hidden">
                <div className="flex flex-row gap-4 items-center justify-center p-2 rounded-md">
                  <button
                    className={`${isPlayedView && "bg-gradient-primary"} disabled:scale-100 w-fit px-2 py-1.5 sm:px-3 sm:py-2 rounded-md text-sm sm:text-base font-bold`}
                    onClick={() => setView('played')}
                    disabled={isPlayedView}
                  >
                    Played
                  </button>
                  <button
                    className={`${!isPlayedView && "bg-gradient-primary"} disabled:scale-100 w-fit px-2 py-1.5 sm:px-3 sm:py-2 rounded-md text-sm sm:text-base font-bold`}
                    onClick={() => setView('toPlay')}
                    disabled={!isPlayedView}
                  >
                    To Play
                  </button>
                </div>
              </div>
            </div>

            <div
              className="flex items-center gap-4 p-4 rounded-xl bg-white/5"
            >
              <div className="p-2 rounded-lg bg-gradient-primary">
                {isPlayedView ? <FaCheck className="size-5" /> : <FaPlus className="size-5" />}
              </div>
              <h3 className="text-xl font-bold">{isPlayedView ? "Games Played" : "To Play"}</h3>
            </div>

            {(isPlayedView ? playedGames : toPlayGames).length > 0 ? (
              <div
                className="flex gap-6 pb-6 w-full overflow-x-auto scrollbar-hide"
                style={{ WebkitOverflowScrolling: 'touch' }}
              >
                {(isPlayedView ? playedGames : toPlayGames).map(game => (
                  <div key={game.id} className="w-60 h-auto shrink-0 rounded-xl shadow-sm text-center flex flex-col items-center border-primary">
                    <img
                      src={coverMap[game?.igdb_id]}
                      alt={game.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <h4 className="px-4 font-black text-sm mb-2 pt-3">{game.name}</h4>
                    <div className="flex gap-2">
                      <button
                        className="bg-gradient-primary py-1.5 px-2 rounded-lg my-2"
                        onClick={() => navigate(`/games/${slugify(game.name)}`)}
                        title="See details"
                      >
                        <FaExternalLinkAlt className="size-4" />
                      </button>
                      <button
                        className="bg-gradient-primary py-1.5 px-2 rounded-lg my-2"
                        onClick={() => handleRemoveFromLibrary(game.id, isPlayedView ? 'played' : 'toPlay')}
                        title="Remove from library"
                      >
                        <FaPlus className="size-4 rotate-45" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white/5 rounded-2xl p-12 border-white/10 flex flex-col gap-2 justify-center items-center">
                <p className="text-white/80 text-center">
                  {isPlayedView
                    ? "You didn't play any games yet ?"
                    : "You aren't hyped for any games ?"}
                </p>
                <p className="text-white/60 text-sm text-center">
                  {isPlayedView
                    ? "Build your played history by marking games as played from any game details page !"
                    : "Build your backlog by marking games as to play from any game details page !"}
                </p>
              </div>
            )}
          </div>
        </section>

        <section>
          <div
            className="flex items-center gap-4 p-4 rounded-xl mb-6 bg-white/5"
          >
            <div className="p-2 rounded-lg bg-gradient-primary">
              <FaClock className="size-5" />
            </div>
            <h3 className="text-xl font-bold">Countdowns</h3>
          </div>
          {countdowns.length > 0 ? (
            <div
              className="flex gap-6 pb-6 w-full overflow-x-auto scrollbar-hide"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {countdowns.map(game => (
                <div key={game.id} className="w-60 h-auto shrink-0 rounded-xl shadow-sm text-center flex flex-col items-center border-primary">
                  <img
                    src={coverMap[game?.igdb_id]}
                    alt={game.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <div className="flex justify-center scale-75">
                    <CountdownTimer targetDate={game.release_date} />
                  </div>
                  <div className="pt-4 border-t border-white/30">
                    <h4 className="px-4 font-black text-sm mb-2">{game.name}</h4>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="bg-gradient-primary py-1.5 px-2 rounded-lg my-2"
                      onClick={() => navigate(`/games/${slugify(game.name)}`)}
                    >
                      <FaExternalLinkAlt className="size-4" />
                    </button>
                    <button
                      className="bg-gradient-primary py-1.5 px-2 rounded-lg my-2"
                      onClick={() => handleRemoveCountdown(game.id)}
                    >
                      <FaPlus className="size-4 rotate-45" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white/5 rounded-2xl p-12 border-white/10 flex flex-col gap-2 justify-center items-center">
              <p className="text-white/80 text-center">No countdowns added yet !</p>
              <p className="text-white/60 text-sm text-center">Get hyped and add countdowns from any game details page !</p>
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
};

export default Profile;
