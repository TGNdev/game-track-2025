import { useAuth } from "../contexts/AuthContext";
import { useGameData } from "../contexts/GameDataContext";
import { useGameUI } from "../contexts/GameUIContext";
import Layout from "../components/shared/Layout";
import { Navigate, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { getGameCovers } from "../js/igdb";
import { useNavigate } from "react-router-dom";
import { slugify } from "../js/utils";
import { removeFromLibrary, removeCountdown, getUserByUsername, setPlaytime, addToLibrary, getPlaytimes, deletePlaytime } from "../js/firebase";
import { FaExternalLinkAlt, FaClock, FaPlus, FaCheck, FaBookmark, FaShareAlt, FaTrophy } from "react-icons/fa";
import { toast } from "react-toastify";
import CountdownTimer from "../components/shared/CountdownTimer";
import ScrollableContainer from "../components/shared/ScrollableContainer";
import CompletionModal from "../components/shared/CompletionModal";
import ConfirmModal from "../components/modals/ConfirmModal";

const Profile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const { userData: loggedInUserData, currentUser } = useAuth();
  const { games, coverMap, setCoverMap } = useGameData();
  const { search } = useGameUI();
  const [view, setView] = useState('played');
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [playtimes, setPlaytimes] = useState({});
  const [completionModal, setCompletionModal] = useState({ isOpen: false, gameId: null, gameName: "", mode: 'transition' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, gameId: null, type: null });

  const isOwnProfile = !username || (loggedInUserData && loggedInUserData.username === username);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      let userData = null;
      if (isOwnProfile) {
        userData = loggedInUserData;
        setProfileData(loggedInUserData);
      } else {
        try {
          userData = await getUserByUsername(username);
          setProfileData(userData);
        } catch (error) {
          toast.error("User not found");
        }
      }

      if (userData?.uid) {
        const stats = await getPlaytimes(userData.uid);
        setPlaytimes(stats);
      }
      setLoading(false);
    };
    fetchProfile();
  }, [username, isOwnProfile, loggedInUserData]);

  const isPlayedView = view === 'played' || view === 'completed';

  const completedGames = useMemo(() => {
    if (!profileData?.library?.played || games.length === 0) return [];
    return games
      .filter(g => profileData.library.played.includes(g.id) && playtimes[g.id]?.status === 'completed')
      .sort((a, b) => (a.release_date?.seconds || 0) - (b.release_date?.seconds || 0));
  }, [profileData?.library?.played, games, playtimes]);

  const playedGames = useMemo(() => {
    if (!profileData?.library?.played || games.length === 0) return [];
    return games
      .filter(g => profileData.library.played.includes(g.id) && playtimes[g.id]?.status !== 'completed')
      .sort((a, b) => {
        const hasA = !!playtimes[a.id];
        const hasB = !!playtimes[b.id];
        if (hasA !== hasB) return hasA ? -1 : 1;
        return (a.release_date?.seconds || 0) - (b.release_date?.seconds || 0);
      });
  }, [profileData?.library?.played, games, playtimes]);

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

    if (type === 'toPlay') {
      const game = games.find(g => g.id === gameId);
      setCompletionModal({ isOpen: true, gameId, gameName: game?.name || "this game", mode: 'transition' });
    } else {
      if (type === 'played' && playtimes[gameId]) {
        setConfirmModal({ isOpen: true, gameId, type: 'played' });
      } else {
        removeFromLibrary(currentUser.uid, gameId, type);
        toast.success("Library updated !");
      }
    }
  };

  const handleConfirmRemove = async () => {
    const { gameId, type } = confirmModal;
    try {
      if (type === 'played') {
        await removeFromLibrary(currentUser.uid, gameId, 'played');
        await deletePlaytime(currentUser.uid, gameId);
        setPlaytimes(prev => {
          const updated = { ...prev };
          delete updated[gameId];
          return updated;
        });
      } else {
        await removeFromLibrary(currentUser.uid, gameId, type);
      }
      toast.success("Library updated !");
      setConfirmModal({ ...confirmModal, isOpen: false });
    } catch (e) {
      toast.error("An error occurred");
    }
  };

  const handleCompletionConfirm = async (status, hours) => {
    const { gameId, mode } = completionModal;
    try {
      if (status === 'remove') {
        if (mode === 'transition') {
          await removeFromLibrary(currentUser.uid, gameId, 'toPlay');
        }
      } else {
        const stats = { status, hours: Number(hours) };
        await setPlaytime(currentUser.uid, gameId, stats);
        setPlaytimes(prev => ({ ...prev, [gameId]: { ...stats, gameId } }));
        if (mode === 'transition') {
          await removeFromLibrary(currentUser.uid, gameId, 'toPlay');
          await addToLibrary(currentUser.uid, gameId, 'played');
        }
      }
      toast.success("Library updated!");
    } catch (e) {
      toast.error("An error occurred");
    }
  };

  const handleAddPlaytime = (gameId) => {
    if (!isOwnProfile) return;
    const game = games.find(g => g.id === gameId);
    const existingStats = playtimes[gameId];
    setCompletionModal({
      isOpen: true,
      gameId,
      gameName: game?.name || "this game",
      mode: 'update',
      initialStatus: existingStats?.status,
      initialHours: existingStats?.hours
    });
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
    const allGamesWithCovers = [...completedGames, ...playedGames, ...toPlayGames, ...countdowns];
    if (allGamesWithCovers.length > 0) {
      const fetchCovers = async () => {
        const gameIds = allGamesWithCovers.map((g) => g.igdb_id);
        const covers = await getGameCovers(gameIds);
        setCoverMap(covers);
      };
      fetchCovers();
    }
  }, [completedGames, playedGames, toPlayGames, countdowns, setCoverMap]);

  useEffect(() => {
    if (!search || search.length < 2) return;
    const q = search.toLowerCase();

    let targetGame = null;
    let targetView = null;

    // Check current view first for efficiency/less jumping
    const currentList = view === 'completed' ? completedGames : view === 'played' ? playedGames : toPlayGames;
    const currentMatch = currentList.find(g => g.name.toLowerCase().includes(q));

    if (currentMatch) {
      targetGame = currentMatch;
      targetView = view;
    } else {
      const matchCompleted = completedGames.find(g => g.name.toLowerCase().includes(q));
      const matchPlayed = playedGames.find(g => g.name.toLowerCase().includes(q));
      const matchToPlay = toPlayGames.find(g => g.name.toLowerCase().includes(q));

      if (matchCompleted) {
        targetGame = matchCompleted;
        targetView = 'completed';
      } else if (matchPlayed) {
        targetGame = matchPlayed;
        targetView = 'played';
      } else if (matchToPlay) {
        targetGame = matchToPlay;
        targetView = 'toPlay';
      }
    }

    if (targetGame && targetView) {
      if (view !== targetView) {
        setView(targetView);
      }

      const timer = setTimeout(() => {
        const element = document.getElementById(`profile-game-${targetGame.id}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [search, completedGames, playedGames, toPlayGames, view]);

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
                <div className="flex flex-row gap-2 sm:gap-4 items-center justify-center p-2 rounded-md">
                  <button
                    className={`${view === 'completed' ? "bg-gradient-primary" : "bg-transparent text-white/60"} disabled:scale-100 w-fit px-3 py-1.5 sm:px-4 sm:py-2 rounded-md text-sm sm:text-base font-bold transition-all`}
                    onClick={() => setView('completed')}
                    disabled={view === 'completed'}
                  >
                    Completed
                  </button>
                  <button
                    className={`${view === 'played' ? "bg-gradient-primary" : "bg-transparent text-white/60"} disabled:scale-100 w-fit px-3 py-1.5 sm:px-4 sm:py-2 rounded-md text-sm sm:text-base font-bold transition-all`}
                    onClick={() => setView('played')}
                    disabled={view === 'played'}
                  >
                    Played
                  </button>
                  <button
                    className={`${view === 'toPlay' ? "bg-gradient-primary" : "bg-transparent text-white/60"} disabled:scale-100 w-fit px-3 py-1.5 sm:px-4 sm:py-2 rounded-md text-sm sm:text-base font-bold transition-all`}
                    onClick={() => setView('toPlay')}
                    disabled={view === 'toPlay'}
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
                {view === 'completed' && <FaTrophy className="size-5" />}
                {view === 'played' && <FaCheck className="size-5" />}
                {view === 'toPlay' && <FaBookmark className="size-5" />}
              </div>
              <h3 className="text-xl font-bold">
                {view === 'completed' && <span>Completed {completedGames.length > 0 ? "(" + completedGames.length + ")" : ''}</span>}
                {view === 'played' && <span>Played {playedGames.length > 0 ? "(" + playedGames.length + ")" : ''}</span>}
                {view === 'toPlay' && <span>To Play {toPlayGames.length > 0 ? "(" + toPlayGames.length + ")" : ''}</span>}
              </h3>
            </div>

            {(view === 'completed' ? completedGames : view === 'played' ? playedGames : toPlayGames).length > 0 ? (
              <ScrollableContainer>
                {(view === 'completed' ? completedGames : view === 'played' ? playedGames : toPlayGames).map(game => (
                  <div key={game.id} id={`profile-game-${game.id}`} className="w-60 h-auto shrink-0 rounded-xl shadow-sm text-center flex flex-col items-center border-primary relative">
                    <div className="relative w-full aspect-[12/17] overflow-hidden rounded-lg">
                      <img
                        src={coverMap[game?.igdb_id]}
                        alt={game.name}
                        className="w-full h-full object-cover"
                      />
                      {isPlayedView && playtimes[game.id] && (
                        <div className="absolute top-2 right-2 flex flex-col gap-2 items-end">
                          <div className={`p-2 rounded-lg backdrop-blur-md shadow-lg border border-white/10 ${playtimes[game.id].status === 'completed' ? 'bg-gradient-tertiary text-white' : 'bg-black/60 text-primary-light'}`}>
                            {playtimes[game.id].status === 'completed' ? <FaTrophy className="size-4" /> : <FaClock className="size-4" />}
                          </div>
                          {playtimes[game.id].hours > 0 && (
                            <div className={`${playtimes[game.id].status === 'completed' ? 'bg-gradient-tertiary text-white' : 'bg-black/60 text-primary-light'} px-2 py-1 rounded-md backdrop-blur-md text-[10px] font-black border border-white/10`}>
                              {playtimes[game.id].hours}H
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <h4 className="px-4 font-black text-sm mb-2 pt-3 line-clamp-1">{game.name}</h4>
                    <div className="flex gap-2">
                      <button
                        className="bg-gradient-primary py-1.5 px-2 rounded-lg my-2"
                        onClick={() => navigate(`/games/${slugify(game.name)}`)}
                        title="See details"
                      >
                        <FaExternalLinkAlt className="size-4" />
                      </button>
                      {isOwnProfile && (
                        <>
                          {(view === 'played' || view === 'completed') && (
                            <button
                              className="bg-gradient-primary py-1.5 px-2 rounded-lg my-2 transition"
                              onClick={() => handleAddPlaytime(game.id)}
                              title="Add/Edit Playtime"
                            >
                              <FaClock className="size-4 text-white" />
                            </button>
                          )}
                          <button
                            className="bg-gradient-primary py-1.5 px-2 rounded-lg my-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveFromLibrary(game.id, (view === 'played' || view === 'completed') ? 'played' : 'toPlay');
                            }}
                            title="Remove from library"
                          >
                            <FaPlus className="size-4 rotate-45" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </ScrollableContainer>
            ) : (
              <div className="bg-white/5 rounded-2xl p-12 border-white/10 flex flex-col gap-2 justify-center items-center">
                <p className="text-white/80 text-center">
                  {view === 'completed'
                    ? (isOwnProfile ? "You haven't finished any games yet ?" : `${profileData?.username} hasn't finished any games yet !`)
                    : view === 'played'
                      ? (isOwnProfile ? "You haven't played anything recently ?" : `${profileData?.username} hasn't played anything recently !`)
                      : (isOwnProfile ? "You aren't hyped for any games ?" : `${profileData?.username} isn't hyped for any games !`)}
                </p>
                {isOwnProfile && (
                  <p className="text-white/60 text-sm text-center">
                    {view === 'completed'
                      ? "Mark games as completed by adding your playtime when you reach the credits to see them here!"
                      : view === 'played'
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
              <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-4 p-2 bg-white/5 rounded-lg w-full border border-white/10">
                These countdowns are based on the release day of the game and may not be totally accurate as games tend to be available on different days (depending on the region you are in) and at a certain time during the day (the game might not usually be available directly at midnight).
              </p>
            </div>
          )}
          {countdowns.length > 0 ? (
            <ScrollableContainer>
              {countdowns.map(game => (
                <div key={game.id} id={`profile-game-${game.id}`} className="w-60 h-auto shrink-0 rounded-xl shadow-sm text-center flex flex-col items-center border-primary">
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
      <CompletionModal
        isOpen={completionModal.isOpen}
        onClose={() => setCompletionModal({ ...completionModal, isOpen: false })}
        gameName={completionModal.gameName}
        mode={completionModal.mode}
        initialStatus={completionModal.initialStatus}
        initialHours={completionModal.initialHours}
        onConfirm={handleCompletionConfirm}
      />
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Warning"
        message="You have registered some playtimes for this game. By removing the game from your library, all your playtimes will be lost !"
        confirmText="Okay"
        onConfirm={handleConfirmRemove}
        onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
      />
    </Layout>
  );
};

export default Profile;
