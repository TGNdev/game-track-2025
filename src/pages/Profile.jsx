import { useAuth } from "../contexts/AuthContext";
import { useGameData } from "../contexts/GameDataContext";
import Layout from "../components/shared/Layout";
import { Navigate, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { getGameCovers } from "../js/igdb";
import { useNavigate } from "react-router-dom";
import { slugify } from "../js/utils";
import { FaExternalLinkAlt, FaClock, FaPlus, FaCheck, FaBookmark, FaShareAlt } from "react-icons/fa";
import { removeFromLibrary, removeCountdown, getUserByUsername } from "../js/firebase";
import { toast } from "react-toastify";
import CountdownTimer from "../components/shared/CountdownTimer";
import ScrollableContainer from "../components/shared/ScrollableContainer";

const Profile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const { userData: loggedInUserData, currentUser } = useAuth();
  const { games, coverMap, setCoverMap } = useGameData();
  const [view, setView] = useState('played');
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  const isOwnProfile = !username || (loggedInUserData && loggedInUserData.username === username);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      if (isOwnProfile) {
        setProfileData(loggedInUserData);
        setLoading(false);
      } else {
        try {
          const fetchedUser = await getUserByUsername(username);
          setProfileData(fetchedUser);
        } catch (error) {
          toast.error("User not found");
        } finally {
          setLoading(false);
        }
      }
    };
    fetchProfile();
  }, [username, isOwnProfile, loggedInUserData]);

  const isPlayedView = view === 'played';

  const playedGames = useMemo(() => {
    if (!profileData?.library?.played || games.length === 0) return [];
    return games
      .filter(g => profileData.library.played.includes(g.id))
      .sort((a, b) => (a.release_date?.seconds || 0) - (b.release_date?.seconds || 0));
  }, [profileData?.library?.played, games]);

  const toPlayGames = useMemo(() => {
    if (!profileData?.library?.toPlay || games.length === 0) return [];

    const now = Date.now();
    const quarterWeight = { Q1: 1, Q2: 2, Q3: 3, Q4: 4 };

    const getRanking = (game) => {
      const rd = game.release_date;
      const isTimestamp = rd && typeof rd === 'object' && rd.seconds !== undefined;

      if (isTimestamp) {
        const time = rd.seconds * 1000;
        if (time < now) return { cat: 0, val: time };
        return { cat: 1, val: time };
      } else {
        if (typeof rd === 'string') {
          const quarterMatch = rd.match(/Q([1-4]) (\d{4})/);
          const tbaMatch = rd.match(/TBA (\d{4})/);
          if (quarterMatch) {
            const [, q, year] = quarterMatch;
            return { cat: 2, val: parseInt(year) * 100 + quarterWeight[`Q${q}`] };
          }
          if (tbaMatch) {
            const [, year] = tbaMatch;
            return { cat: 2, val: parseInt(year) * 100 + 99 };
          }
          if (rd === "TBA") return { cat: 2, val: 999999 };
        }
        return { cat: 2, val: 999999 };
      }
    };

    return games
      .filter(g => profileData.library.toPlay.includes(g.id))
      .sort((a, b) => {
        const rankA = getRanking(a);
        const rankB = getRanking(b);

        if (rankA.cat !== rankB.cat) return rankA.cat - rankB.cat;
        if (rankA.val !== rankB.val) return rankA.val - rankB.val;
        return a.name.localeCompare(b.name);
      });
  }, [profileData?.library?.toPlay, games]);

  const handleRemoveFromLibrary = (gameId, type) => {
    if (!isOwnProfile) return;
    removeFromLibrary(currentUser.uid, gameId, type);
    toast.success("Library updated !");
  };

  const countdowns = useMemo(() => {
    if (!profileData?.wanted || games.length === 0) return [];
    return games
      .filter(g => profileData.wanted.includes(g.id))
      .sort((a, b) => (a.release_date?.seconds || Infinity) - (b.release_date?.seconds || Infinity));
  }, [profileData?.wanted, games]);

  const handleRemoveCountdown = (gameId) => {
    if (!isOwnProfile) return;
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

  if (!currentUser && !username) return <Navigate to="/" />;
  if (loading) return (
    <Layout>
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    </Layout>
  );

  if (!profileData) return (
    <Layout>
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <h2 className="text-2xl font-bold">User not found</h2>
        <button onClick={() => navigate("/")} className="bg-gradient-primary px-4 py-2 rounded-lg">Go Home</button>
      </div>
    </Layout>
  );

  const handleShareProfile = () => {
    const url = `${window.location.origin}/#/profiles/${profileData.username}`;
    navigator.clipboard.writeText(url);
    toast.success("Profile link copied to clipboard !");
  };

  return (
    <Layout>
      <div className="mx-6 mt-6 flex flex-col gap-10 md:gap-14">
        <section className="flex flex-col items-center md:items-start gap-4">
          <div className="flex flex-col md:flex-row items-center gap-6 w-full justify-between">
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-center md:items-start">
                <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                  {profileData?.username || 'Gamer'}
                </h1>
                <p className="text-white/40 font-bold uppercase tracking-widest text-xs md:text-sm">
                  Personal Library
                </p>
              </div>
            </div>
            <button
              onClick={handleShareProfile}
              className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-xl transition-all shadow-lg"
            >
              <FaShareAlt className="text-primary-light" />
              <span className="font-bold text-sm tracking-tight">Share Profile</span>
            </button>
          </div>
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
                {isPlayedView ? <FaCheck className="size-5" /> : <FaBookmark className="size-5" />}
              </div>
              <h3 className="text-xl font-bold">
                {isPlayedView ? (
                  <span>Played {playedGames.length > 0 ? "(" + playedGames.length + ")" : ''}</span>
                ) : (
                  <span>To Play {toPlayGames.length > 0 ? "(" + toPlayGames.length + ")" : ''}</span>
                )}
              </h3>
            </div>

            {(isPlayedView ? playedGames : toPlayGames).length > 0 ? (
              <ScrollableContainer>
                {(isPlayedView ? playedGames : toPlayGames).map(game => (
                  <div key={game.id} className="w-60 h-auto shrink-0 rounded-xl shadow-sm text-center flex flex-col items-center border-primary">
                    <img
                      src={coverMap[game?.igdb_id]}
                      alt={game.name}
                      className="object-cover rounded-lg aspect-[12/17]"
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
                      {isOwnProfile && (
                        <button
                          className="bg-gradient-primary py-1.5 px-2 rounded-lg my-2"
                          onClick={() => handleRemoveFromLibrary(game.id, isPlayedView ? 'played' : 'toPlay')}
                          title="Remove from library"
                        >
                          <FaPlus className="size-4 rotate-45" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </ScrollableContainer>
            ) : (
              <div className="bg-white/5 rounded-2xl p-12 border-white/10 flex flex-col gap-2 justify-center items-center">
                <p className="text-white/80 text-center">
                  {isPlayedView
                    ? (isOwnProfile ? "You didn't play any games yet ?" : `${profileData?.username} didn't play any games yet !`)
                    : (isOwnProfile ? "You aren't hyped for any games ?" : `${profileData?.username} isn't hyped for any games !`)}
                </p>
                {isOwnProfile && (
                  <p className="text-white/60 text-sm text-center">
                    {isPlayedView
                      ? "Build your played history by marking games as played from any game details page !"
                      : "Build your backlog by marking games as to play from any game details page !"}
                  </p>
                )}
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
            <h3 className="text-xl font-bold">Countdowns {countdowns.length > 0 ? `(${countdowns.length})` : ''}</h3>
          </div>
          {countdowns.length > 0 && (
            <div className="flex justify-between items-end">
              <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-4 p-2 bg-white/5 rounded-lg w-full">
                These countdowns are based on the release day of the game and may not be totally accurate as games tend to be available on different days (depending on the region you are in) and at a certain time during the day (the game might not usually be available directly at midnight).
              </p>
            </div>
          )}
          {countdowns.length > 0 ? (
            <ScrollableContainer>
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
                  <div className="border-b border-white/30 w-full">
                    <h4 className="px-4 font-black text-sm mb-2">{game.name}</h4>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="bg-gradient-primary py-1.5 px-2 rounded-lg my-2"
                      onClick={() => navigate(`/games/${slugify(game.name)}`)}
                    >
                      <FaExternalLinkAlt className="size-4" />
                    </button>
                    {isOwnProfile && (
                      <button
                        className="bg-gradient-primary py-1.5 px-2 rounded-lg my-2"
                        onClick={() => handleRemoveCountdown(game.id)}
                      >
                        <FaPlus className="size-4 rotate-45" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </ScrollableContainer>
          ) : (
            <div className="bg-white/5 rounded-2xl p-12 border-white/10 flex flex-col gap-2 justify-center items-center">
              <p className="text-white/80 text-center">
                {isOwnProfile ? "No countdowns added yet !" : `${profileData?.username} has no countdowns added !`}
              </p>
              {isOwnProfile && (
                <p className="text-white/60 text-sm text-center">Get hyped and add countdowns from any game details page !</p>
              )}
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
};

export default Profile;
