import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { FaArrowLeft, FaClock, FaTrophy, FaCalendarAlt, FaExternalLinkAlt, FaPlus, FaCheck, FaImage } from "react-icons/fa";
import Layout from "../components/shared/Layout";
import { useGameData } from "../contexts/GameDataContext";
import { useGameUI } from "../contexts/GameUIContext";
import { useAuth } from "../contexts/AuthContext";
import { slugify } from "../js/utils";
import { getGameCovers, getGameScreenshots, getGameTimeToBeat } from "../js/igdb";
import { addToLibrary, removeFromLibrary, addCountdown, removeCountdown } from "../js/firebase";
import { toast } from "react-toastify";
import CoverSkeleton from "../components/skeletons/CoverSkeleton";
import he from "he";
import { FiClock } from "react-icons/fi";

const getRatingStyle = (rating) => {
  const baseClasses = "size-12 rounded-xl text-white font-bold flex items-center justify-center text-lg shadow-lg";
  if (!rating || rating === 0) return `${baseClasses} bg-slate-300`;
  if (rating < 70) return `${baseClasses} bg-red-500`;
  if (rating >= 70 && rating < 80) return `${baseClasses} bg-amber-400`;
  if (rating >= 80 && rating < 90) return `${baseClasses} bg-green-400`;
  return `${baseClasses} bg-green-600`;
};

const formatTime = (seconds) => {
  if (!seconds) return "N/A";
  const hours = Math.floor(seconds / 3600);
  return `${hours}h`;
};

export default function GameDetails() {
  const { game: gameSlug } = useParams();
  const navigate = useNavigate();
  const [coverLoaded, setCoverLoaded] = useState(false);
  const [currentScreenshotIndex, setCurrentScreenshotIndex] = useState(0);
  const [showAllScreenshots, setShowAllScreenshots] = useState(false);
  const { userData, currentUser } = useAuth();

  const {
    games,
    loadingGames,
    awardsPerGame,
    coverMap,
    setCoverMap,
    screenshotsMap,
    setScreenshotsMap,
    timesToBeat,
    setTimesToBeat
  } = useGameData();

  const { getPlatformsSvg } = useGameUI();

  const game = useMemo(() => {
    return games.find(g => slugify(g.name) === gameSlug);
  }, [games, gameSlug]);

  const isInLibrary = useMemo(() => userData?.library?.includes(game?.id), [userData?.library, game?.id]);
  const hasCountdown = useMemo(() => userData?.wanted?.includes(game?.id), [userData?.wanted, game?.id]);

  const handleLibraryAction = async () => {
    if (!currentUser) {
      toast.info("Please log in to add games to your library");
      return;
    }
    try {
      if (isInLibrary) {
        await removeFromLibrary(currentUser.uid, game.id);
        toast.info(`${game.name} removed from library`);
      } else {
        await addToLibrary(currentUser.uid, game.id);
        toast.success(`${game.name} added to library !`);
      }
    } catch (e) {
      toast.error("An error occurred. Please try again.");
    }
  };

  const handleCountdownAction = async () => {
    if (!currentUser) {
      toast.info("Please log in to add countdown for this game");
      return;
    }
    try {
      if (hasCountdown) {
        await removeCountdown(currentUser.uid, game.id);
        toast.info(`Countdown removed for ${game.name}`);
      } else {
        await addCountdown(currentUser.uid, game.id);
        toast.success(`Countdown added for ${game.name}`);
      }
    } catch (e) {
      toast.error("An error occurred. Please try again.");
    }
  };

  const gameAwards = awardsPerGame[game?.id] || [];
  const gameTimeToBeat = timesToBeat[game?.igdb_id];
  const gameScreenshots = useMemo(() => screenshotsMap[game?.igdb_id] || [], [screenshotsMap, game?.igdb_id]);
  const displayedScreenshots = showAllScreenshots
    ? gameScreenshots.slice(0)
    : gameScreenshots.slice(0, 4);
  const gameCover = coverMap[game?.igdb_id];
  const canAddCountdown = game?.release_date?.seconds;

  useEffect(() => {
    window.scrollTo(0, 0);
    if (game) {
      document.title = `${he.decode(game.name)} - Game Track 2025`;
    }
  }, [game]);

  useEffect(() => {
    if (gameScreenshots.length > 1) {
      const interval = setInterval(() => {
        setCurrentScreenshotIndex((prev) => (prev + 1) % Math.min(gameScreenshots.length, 6));
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [gameScreenshots]);

  useEffect(() => {
    if (game && game.igdb_id) {
      const fetchMedia = async () => {
        const id = game.igdb_id;

        if (!coverMap[id]) {
          const covers = await getGameCovers([id]);
          setCoverMap(prev => ({ ...prev, ...covers }));
        }

        if (!screenshotsMap[id]) {
          const screenshots = await getGameScreenshots([id]);
          setScreenshotsMap(prev => ({ ...prev, ...screenshots }));
        }

        if (!timesToBeat[id]) {
          const times = await getGameTimeToBeat([id]);
          setTimesToBeat(prev => ({ ...prev, ...times }));
        }
      };
      fetchMedia();
    }
  }, [game, coverMap, screenshotsMap, timesToBeat, setCoverMap, setScreenshotsMap, setTimesToBeat]);

  if (loadingGames) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-12 h-12 bg-white/20 rounded-full mb-4"></div>
            <p className="text-white/50 italic">Loading game details...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!game) {
    return (
      <Layout>
        <div className="flex flex-col justify-center items-center min-h-[60vh] gap-4">
          <p className="text-xl font-bold">Game not found</p>
          <button
            onClick={() => navigate("/")}
            className="bg-gradient-primary px-4 py-2 rounded-md flex items-center gap-2 transition hover:scale-105"
          >
            <FaArrowLeft /> Go Home
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="w-full flex flex-col gap-8 pb-12">
        <div className="relative w-full h-[40vh] min-h-[350px] overflow-hidden shadow-2xl opacity-70">
          {gameScreenshots.length > 0 ? (
            gameScreenshots.slice(0, 6).map((shot, idx) => (
              <img
                key={shot}
                src={shot}
                alt={game.name}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${idx === currentScreenshotIndex ? "opacity-100" : "opacity-0"
                  }`}
              />
            ))
          ) : (
            <div className="w-full h-full bg-gradient-primary opacity-50"></div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent"></div>

          <button
            onClick={() => navigate(-1)}
            className="absolute top-6 left-6 z-20 bg-black/40 backdrop-blur-md p-3 rounded-full hover:scale-110 transition shadow-lg border border-white/10"
          >
            <FaArrowLeft className="text-white" />
          </button>
        </div>
        <div className="px-6 -mt-32 relative z-10 flex flex-col md:flex-row gap-8 items-start">
          <div className="w-48 md:w-64 shrink-0 relative group self-center md:self-start">
            <div className="aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl border-2 border-white/10 bg-background">
              {!coverLoaded && <CoverSkeleton />}
              {gameCover && (
                <img
                  src={gameCover}
                  alt={`${game.name} cover`}
                  className={`w-full h-full object-cover transition-opacity duration-500 ${coverLoaded ? 'opacity-100' : 'opacity-0'}`}
                  onLoad={() => setCoverLoaded(true)}
                />
              )}
            </div>
            {currentUser ? (
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                <button
                  onClick={handleLibraryAction}
                  className={`p-3 rounded-full shadow-xl transition-all duration-300 hover:scale-105 ${isInLibrary ? 'bg-gradient-secondary' : 'bg-gradient-primary'}`}
                >
                  {isInLibrary ? <FaCheck /> : <FaPlus />}
                </button>
                {canAddCountdown && (
                  <button
                    onClick={handleCountdownAction}
                    className={`p-3 rounded-full shadow-xl transition-all duration-300 hover:scale-105 ${hasCountdown ? 'bg-gradient-tertiary' : 'bg-gradient-primary'}`}
                  >
                    <FiClock />
                  </button>
                )}
              </div>
            ) : (
              <div className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 flex gap-2 w-full justify-center">
                <div
                  className="flex items-center gap-2 text-sm bg-white/30 backdrop-blur-md px-2 py-1.5 rounded-md w-fit font-semibold"
                >
                  Login to discover actions
                </div>
              </div>
            )}
          </div>
          <div className="flex-1 space-y-6 pt-6 md:pt-32 w-full">
            <div>
              <h1 className="text-4xl md:text-6xl font-black mb-4 w-full md:text-left text-center">
                {he.decode(game.name)}
              </h1>
              <div className="flex flex-wrap gap-6 items-center text-white/80">
                <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                  <FaCalendarAlt className="text-primary-light" />
                  <span className="font-semibold">
                    {game.release_date?.seconds
                      ? new Date(game.release_date.seconds * 1000).toLocaleDateString("en-US", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                      : game.release_date || "TBA"}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold uppercase text-white/70">Available on</span>
                  <div className="flex gap-2">
                    {Object.keys(game.platforms)
                      .filter((p) => game.platforms[p])
                      .map((p) => (
                        <div key={p} className="hover:scale-110 transition duration-300">
                          {getPlatformsSvg(p)}
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-6 items-center">
              <div className="flex gap-6">
                <div className="flex flex-col items-center gap-2">
                  <div className={getRatingStyle(Number(game.ratings.critics))}>
                    {Number(game.ratings.critics) === 0 ? "/" : game.ratings.critics}
                  </div>
                  <span className="text-[10px] font-bold uppercase text-white/50 text-center">Critics<br />Rating</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className={getRatingStyle(Number(game.ratings.players))}>
                    {Number(game.ratings.players) === 0 ? "/" : game.ratings.players}
                  </div>
                  <span className="text-[10px] font-bold uppercase text-white/50 text-center">Players<br />Rating</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                {game.ratings.link && (
                  <a
                    href={game.ratings.link}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-sm bg-gradient-primary px-2 py-1.5 rounded-md h-fit transition hover:scale-105 self-center font-bold shadow-lg"
                  >
                    OpenCritic <FaExternalLinkAlt className="text-[10px]" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="px-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-12 mt-6">
            {gameAwards.length > 0 && (
              <section className="bg-white/5 shadow-2xl border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-gradient-tertiary rounded-lg">
                    <FaTrophy className="text-2xl text-white" />
                  </div>
                  <h2 className="text-2xl font-black">Awards Won</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {gameAwards.map((award, i) => (
                    <Link
                      key={i}
                      to={`/game-awards-history/${award.year}/${award.slug}`}
                      className="group flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-primary-light transition-all duration-300 hover:bg-white/10 hover:shadow-lg hover:scale-[1.02]"
                    >
                      <div>
                        <p className="text-[10px] font-black text-primary-light uppercase tracking-widest mb-1">{award.year}</p>
                        <p className="font-bold text-lg leading-snug">{he.decode(award.title)}</p>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition duration-300 translate-x-4 group-hover:translate-x-0 shrink-0 ml-4">
                        <FaExternalLinkAlt className="text-primary-light" />
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
            {gameScreenshots.length > 1 && (
              <section className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-3xl font-black flex items-center gap-4">
                    <div className="p-3 bg-gradient-primary rounded-lg shrink-0 shadow-lg"><FaImage className="text-xl" /></div>
                    Screenshots ({gameScreenshots.length})
                  </h2>
                  {gameScreenshots.length > 5 && (
                    <button
                      onClick={() => setShowAllScreenshots(!showAllScreenshots)}
                      className="text-sm font-semibold bg-gradient-primary px-2 py-1.5 rounded-md transition hover:scale-105 shadow-md"
                    >
                      {showAllScreenshots ? "See Less" : "See All"}
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {displayedScreenshots.map((shot, i) => (
                    <div key={i} className="rounded-[2rem] overflow-hidden aspect-video border border-white/10 shadow-xl group relative">
                      <img
                        src={shot}
                        alt={`${game.name} screen ${i}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-700 ease-out"
                      />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
          <div className="space-y-8 mt-6">
            {gameTimeToBeat && (
              <section className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                  <FaClock className="text-8xl" />
                </div>
                <div className="relative z-10">
                  <h2 className="text-xl font-black mb-6">
                    Playtime
                  </h2>
                  <div className="space-y-6">
                    <div className="flex justify-between items-end">
                      <p className="text-white/60 text-[10px] font-black uppercase tracking-widest -mt-4 mb-3 border border-white/20 p-2 rounded-lg backdrop-blur-sm">
                        Please note that this data is contributed by the community (via <span className="text-white">IGDB</span>) and may not exactly reflect your personal playthroughs.
                      </p>
                    </div>
                    <div className="flex justify-between items-end border-b border-white/10 pb-4">
                      <div className="flex flex-col">
                        <span className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-1">Main Story</span>
                        <span className="text-white font-bold">Standard Play</span>
                      </div>
                      <span className="text-2xl font-black text-primary-light">{formatTime(gameTimeToBeat.normally)}</span>
                    </div>
                    <div className="flex justify-between items-end border-b border-white/10 pb-4">
                      <div className="flex flex-col">
                        <span className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-1">Fast Run</span>
                        <span className="text-white font-bold">Rushed Play</span>
                      </div>
                      <span className="text-2xl font-black text-primary-light">{formatTime(gameTimeToBeat.hastily)}</span>
                    </div>
                    <div className="flex justify-between items-end ">
                      <div className="flex flex-col">
                        <span className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-1">Completionist</span>
                        <span className="text-white font-bold">100% Run</span>
                      </div>
                      <span className="text-2xl font-black text-primary-light">{formatTime(gameTimeToBeat.completely)}</span>
                    </div>
                  </div>
                </div>
              </section>
            )}
            <section className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6 shadow-2xl ">
              <div>
                <h3 className="text-xs font-black uppercase text-primary-light mb-4 flex items-center gap-2">
                  Developers
                </h3>
                <div className="flex flex-col gap-3">
                  {game.developers.map((dev, i) => (
                    <a
                      key={i}
                      href={dev.link}
                      target="_blank"
                      rel="noreferrer"
                      className="text-lg font-black transition flex items-center flex-row gap-2 hover:scale-105"
                    >
                      {he.decode(dev.name)}
                      <FaExternalLinkAlt className="text-[10px]" />
                    </a>
                  ))}
                </div>
              </div>
              <div className="pt-6 border-t border-white/10">
                <h3 className="text-xs font-black uppercase text-primary-light mb-4 flex items-center gap-2">
                  Publishers
                </h3>
                <div className="flex flex-col gap-3">
                  {game.editors.map((editor, i) => (
                    <a
                      key={i}
                      href={editor.link}
                      target="_blank"
                      rel="noreferrer"
                      className="text-lg font-black transition flex items-center flex-row gap-2 hover:scale-105"
                    >
                      {he.decode(editor.name)}
                      <FaExternalLinkAlt className="text-[10px]" />
                    </a>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </Layout>
  );
}
