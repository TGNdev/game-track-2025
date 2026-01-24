import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { FaArrowLeft, FaClock, FaTrophy, FaCalendarAlt, FaExternalLinkAlt, FaBookmark, FaCheck, FaImage, FaExpandAlt, FaChevronLeft, FaChevronRight, FaUsers } from "react-icons/fa";
import { FiX } from "react-icons/fi";
import Layout from "../components/shared/Layout";
import { useGameData } from "../contexts/GameDataContext";
import { useGameUI } from "../contexts/GameUIContext";
import { useAuth } from "../contexts/AuthContext";
import { slugify } from "../js/utils";
import { getGameCovers, getGameScreenshots, getGameTimeToBeat } from "../js/igdb";
import { addToLibrary, removeFromLibrary, addCountdown, removeCountdown, setPlaytime, getPlaytimes, deletePlaytime, getGlobalPlaytimesForGame } from "../js/firebase";
import { toast } from "react-toastify";
import CoverSkeleton from "../components/skeletons/CoverSkeleton";
import ScreenshotSkeleton from "../components/skeletons/ScreenshotSkeleton";
import he from "he";
import { FiClock } from "react-icons/fi";
import CompletionModal from "../components/shared/CompletionModal";
import ConfirmModal from "../components/modals/ConfirmModal";

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
  const [selectedScreenshotIndex, setSelectedScreenshotIndex] = useState(null);
  const [direction, setDirection] = useState(0);
  const [heroImagesLoaded, setHeroImagesLoaded] = useState({});
  const [sectionImagesLoaded, setSectionImagesLoaded] = useState({});
  const [galleryImageLoaded, setGalleryImageLoaded] = useState(false);
  const [completionModalOpen, setCompletionModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [personalPlaytime, setPersonalPlaytime] = useState(null);
  const [averagePlaytime, setAveragePlaytime] = useState(null);
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

  const { getPlatformsSvg, isReleased, activeTags } = useGameUI();

  const game = useMemo(() => {
    return games.find(g => slugify(g.name) === gameSlug);
  }, [games, gameSlug]);

  const gameTags = useMemo(() => activeTags(game), [activeTags, game]);

  const isPlayed = useMemo(() => userData?.library?.played?.includes(game?.id), [userData?.library?.played, game?.id]);
  const isToPlay = useMemo(() => userData?.library?.toPlay?.includes(game?.id), [userData?.library?.toPlay, game?.id]);
  const hasCountdown = useMemo(() => userData?.wanted?.includes(game?.id), [userData?.wanted, game?.id]);

  const handleLibraryAction = async (type) => {
    if (!currentUser) {
      toast.info(`Please log in to add games to your ${type === 'played' ? 'played' : 'to play'} list`);
      return;
    }
    try {
      const isCurrentlyInType = type === 'played' ? isPlayed : isToPlay;

      if (isCurrentlyInType) {
        if (type === 'toPlay') {
          setCompletionModalOpen(true);
        } else {
          if (type === 'played' && personalPlaytime) {
            setConfirmModalOpen(true);
          } else {
            await removeFromLibrary(currentUser.uid, game.id, type);
            toast.info(`${game.name} removed from your ${type === 'played' ? 'played' : 'to play'} list`);
          }
        }
      } else {
        await removeFromLibrary(currentUser.uid, game.id, type === 'played' ? 'toPlay' : 'played');
        await addToLibrary(currentUser.uid, game.id, type);
        toast.success(`${game.name} added to your ${type === 'played' ? 'played' : 'to play'} list !`);
      }
    } catch (e) {
      toast.error("An error occurred. Please try again.");
    }
  };

  const handleConfirmRemove = async () => {
    try {
      await removeFromLibrary(currentUser.uid, game.id, 'played');
      await deletePlaytime(currentUser.uid, game.id);
      setPersonalPlaytime(null);
      toast.info(`${game.name} removed from your played list`);
      setConfirmModalOpen(false);
    } catch (e) {
      toast.error("An error occurred");
    }
  };

  const handleCompletionConfirm = async (status, hours) => {
    try {
      if (status === 'remove') {
        await removeFromLibrary(currentUser.uid, game.id, 'toPlay');
      } else {
        const stats = { status, hours: Number(hours) };
        await setPlaytime(currentUser.uid, game.id, stats);
        setPersonalPlaytime(stats);
        await removeFromLibrary(currentUser.uid, game.id, 'toPlay');
        await addToLibrary(currentUser.uid, game.id, 'played');
      }
      toast.info(`Library updated for ${game.name}`);
    } catch (e) {
      toast.error("An error occurred");
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
  const canAddCountdown = game?.release_date?.seconds && (game.release_date.seconds * 1000 > Date.now());

  useEffect(() => {
    const fetchStats = async () => {
      if (currentUser?.uid && game?.id) {
        const stats = await getPlaytimes(currentUser.uid);
        if (stats[game.id]) {
          setPersonalPlaytime(stats[game.id]);
        }
      }

      if (game?.id) {
        const globalPlaytimes = await getGlobalPlaytimesForGame(game.id);
        const completedPlaytimes = globalPlaytimes.filter(p => p.status === 'completed' && p.hours > 0);
        if (completedPlaytimes.length > 0) {
          const totalHours = completedPlaytimes.reduce((acc, p) => acc + p.hours, 0);
          setAveragePlaytime(Math.round(totalHours / completedPlaytimes.length));
        }
      }
    };
    fetchStats();
  }, [currentUser, game?.id]);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (game) {
      document.title = `${he.decode(game.name || "") || "Game"} - Game Track 2025`;
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
    const fetchMedia = async () => {
      const id = game?.igdb_id;
      if (!id) return;

      if (!coverMap[id]) {
        const covers = await getGameCovers([id]);
        if (Object.keys(covers).length > 0) {
          setCoverMap(prev => ({ ...prev, ...covers }));
        }
      }

      if (!screenshotsMap[id]) {
        const screenshots = await getGameScreenshots([id]);
        if (Object.keys(screenshots).length > 0) {
          setScreenshotsMap(prev => ({ ...prev, ...screenshots }));
        }
      }

      if (!timesToBeat[id]) {
        const times = await getGameTimeToBeat([id]);
        if (Object.keys(times).length > 0) {
          setTimesToBeat(prev => ({ ...prev, ...times }));
        }
      }
    };

    fetchMedia();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game?.igdb_id]);

  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset, velocity) => {
    return Math.abs(offset) * velocity;
  };

  const paginate = (newDirection) => {
    setGalleryImageLoaded(false);
    setDirection(newDirection);
    setSelectedScreenshotIndex((prev) => {
      if (newDirection === 1) {
        return (prev + 1) % gameScreenshots.length;
      }
      return (prev - 1 + gameScreenshots.length) % gameScreenshots.length;
    });
  };

  // No early return for loadingGames to avoid full-page layout shift
  const isActuallyLoading = loadingGames || (!game && !loadingGames); // Consider it loading if we don't have a game yet


  if (!game && !loadingGames) {
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
      <div className="w-full flex flex-col gap-6 md:gap-8 pb-12">
        <div className="relative w-full h-[30vh] md:h-[40vh] min-h-[250px] md:min-h-[350px] overflow-hidden shadow-2xl opacity-70 bg-black/20">
          {(isActuallyLoading || gameScreenshots.length > 0) ? (
            (isActuallyLoading ? [1] : gameScreenshots.slice(0, 6)).map((shot, idx) => (
              <div key={idx} className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${idx === currentScreenshotIndex ? "opacity-100" : "opacity-0"}`}>
                {(isActuallyLoading || !heroImagesLoaded[idx]) && (
                  <ScreenshotSkeleton />
                )}
                {!isActuallyLoading && (
                  <img
                    src={shot}
                    alt={game?.name}
                    className="w-full h-full object-cover"
                    onLoad={() => setHeroImagesLoaded(prev => ({ ...prev, [idx]: true }))}
                  />
                )}
              </div>
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
        <div className="px-4 md:px-6 -mt-20 md:mt-[-8rem] relative z-10 flex flex-col md:flex-row gap-6 md:gap-8 items-start">
          <div className="w-64 shrink-0 relative group self-center md:self-start">
            <div className="aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl border-2 border-white/10 bg-background relative">
              {(isActuallyLoading || !coverLoaded) && <CoverSkeleton />}
              {!isActuallyLoading && gameCover && (
                <img
                  src={gameCover}
                  alt={`${game?.name} cover`}
                  className={`w-full h-full object-cover transition-opacity duration-500 ${coverLoaded ? 'opacity-100' : 'opacity-0'}`}
                  onLoad={() => setCoverLoaded(true)}
                />
              )}
              {personalPlaytime && (
                <div className="absolute top-2 right-2 flex flex-col gap-2 items-end">
                  <div className={`p-2 rounded-lg backdrop-blur-md shadow-lg border border-white/10 ${personalPlaytime.status === 'completed' ? 'bg-gradient-tertiary text-white' : 'bg-black/60 text-primary-light'}`}>
                    {personalPlaytime.status === 'completed' ? <FaTrophy className="size-4" /> : <FaClock className="size-4" />}
                  </div>
                  {personalPlaytime.hours > 0 && (
                    <div className={`${personalPlaytime.status === 'completed' ? 'bg-gradient-tertiary text-white' : 'bg-black/60 text-primary-light'} px-2 py-1 rounded-md backdrop-blur-md text-[10px] font-black border border-white/10`}>
                      {personalPlaytime.hours}H
                    </div>
                  )}
                </div>
              )}
            </div>
            {currentUser ? (
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {isReleased(game?.release_date) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLibraryAction('played');
                    }}
                    title={isPlayed ? "Remove from Played" : "Add to Played"}
                    className={`p-3 rounded-full shadow-xl transition-all duration-300 hover:scale-105 ${isPlayed ? 'bg-gradient-secondary' : 'bg-gradient-primary'}`}
                  >
                    <FaCheck />
                  </button>
                )}
                {isPlayed && (
                  <button
                    onClick={() => setCompletionModalOpen(true)}
                    title="Add/Edit Playtime"
                    className="p-3 rounded-full shadow-xl transition-all duration-300 hover:scale-105 bg-gradient-primary"
                  >
                    <FiClock className="text-white" />
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLibraryAction('toPlay');
                  }}
                  title={isToPlay ? "Remove from To Play" : "Add to To Play"}
                  className={`p-3 rounded-full shadow-xl transition-all duration-300 hover:scale-105 ${isToPlay ? 'bg-gradient-secondary' : 'bg-gradient-primary'}`}
                >
                  <FaBookmark />
                </button>
                {canAddCountdown && (
                  <button
                    onClick={handleCountdownAction}
                    title={hasCountdown ? "Remove Countdown" : "Add Countdown"}
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
          <div className="flex-1 space-y-4 md:space-y-6 pt-4 md:pt-32 w-full">
            <div className="flex flex-col items-center md:items-start gap-3">
              <div className="flex flex-wrap gap-2">
                {isActuallyLoading ? (
                  <div className="bg-white/10 w-24 h-6 rounded-full animate-pulse border border-white/5" />
                ) : (
                  <>
                    {gameTags.map((tag) => (
                      <div key={tag.key} className={`${tag.color} text-[10px] uppercase font-black px-3 py-1 rounded-full shadow-lg border border-white/10 whitespace-nowrap`}>
                        {tag.label}
                      </div>
                    ))}
                  </>
                )}
              </div>
              <h1 className="text-3xl md:text-6xl font-black w-full md:text-left text-center leading-tight min-h-[1.2em]">
                {isActuallyLoading ? <span className="opacity-20 bg-white rounded-lg inline-block w-64 h-12 animate-pulse"></span> : he.decode(game?.name || "")}
              </h1>
              <div className="flex flex-wrap gap-4 md:gap-6 items-center justify-center md:justify-start text-white/80">
                <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                  <FaCalendarAlt className="text-primary-light" />
                  <span className="font-semibold">
                    {game?.release_date?.seconds
                      ? new Date(game.release_date.seconds * 1000).toLocaleDateString("en-US", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                      : game?.release_date || "TBA"}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold uppercase text-white/70">Available on</span>
                  <div className="flex gap-2">
                    {isActuallyLoading ? (
                      <div className="flex gap-2">
                        {[1, 2, 3].map(i => <div key={i} className="size-5 rounded bg-white/10 animate-pulse" />)}
                      </div>
                    ) : (
                      game?.platforms && Object.keys(game.platforms)
                        .filter((p) => game.platforms[p])
                        .map((p) => (
                          <div key={p} className="hover:scale-110 transition duration-300">
                            {getPlatformsSvg(p)}
                          </div>
                        ))
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-4 md:gap-6 items-center justify-center md:justify-start">
                <div className="flex gap-4 md:gap-6">
                  <div className="flex flex-col items-center gap-2">
                    <div className={`${getRatingStyle(Number(game?.ratings?.critics || 0))} scale-90 md:scale-100`}>
                      {isActuallyLoading ? "..." : (Number(game?.ratings?.critics) === 0 ? "/" : game?.ratings?.critics)}
                    </div>
                    <span className="text-[10px] font-bold uppercase text-white/50 text-center">Critics<br />Rating</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className={`${getRatingStyle(Number(game?.ratings?.players || 0))} scale-90 md:scale-100`}>
                      {isActuallyLoading ? "..." : (Number(game?.ratings?.players) === 0 ? "/" : game?.ratings?.players)}
                    </div>
                    <span className="text-[10px] font-bold uppercase text-white/50 text-center">Players<br />Rating</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 md:gap-3 justify-center">
                  {!isActuallyLoading && game?.ratings?.link && (
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
        </div>
        <div className="px-4 md:px-6 grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          <div className="lg:col-span-2 space-y-8 md:space-y-12 mt-2 md:mt-6">
            {gameAwards.length > 0 && (
              <section className="bg-white/5 shadow-2xl border border-white/10 rounded-2xl p-4 md:p-6">
                <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
                  <div className="p-2 md:p-3 bg-gradient-tertiary rounded-lg">
                    <FaTrophy className="text-xl md:text-2xl text-white" />
                  </div>
                  <h2 className="text-xl md:text-2xl font-black">Awards Won</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
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
              <section className="space-y-4 md:space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl md:text-3xl font-black flex items-center gap-3 md:gap-4">
                    <div className="p-2 md:p-3 bg-gradient-primary rounded-lg shrink-0 shadow-lg">
                      <FaImage className="text-lg" />
                    </div>
                    Screenshots ({gameScreenshots.length})
                  </h2>
                  {gameScreenshots.length > 5 && (
                    <button
                      onClick={() => setShowAllScreenshots(!showAllScreenshots)}
                      className="text-xs md:text-sm font-semibold bg-gradient-primary px-3 py-1.5 rounded-md transition hover:scale-105 shadow-md"
                    >
                      {showAllScreenshots ? "See Less" : "See All"}
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  {displayedScreenshots.map((shot, i) => (
                    <div
                      key={i}
                      className="rounded-[2rem] overflow-hidden aspect-video border border-white/10 shadow-xl group relative cursor-pointer bg-white/5"
                      onClick={() => {
                        setGalleryImageLoaded(false);
                        setSelectedScreenshotIndex(i);
                      }}
                    >
                      {!sectionImagesLoaded[i] && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <img src="loading.gif" alt="Loading..." className="w-10 h-10 opacity-20" />
                        </div>
                      )}
                      <img
                        src={shot}
                        alt={`${game.name} screen ${i}`}
                        className={`w-full h-full object-cover group-hover:scale-105 transition duration-700 ease-out ${sectionImagesLoaded[i] ? 'opacity-100' : 'opacity-0'}`}
                        loading="lazy"
                        onLoad={() => setSectionImagesLoaded(prev => ({ ...prev, [i]: true }))}
                      />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <FaExpandAlt className="text-white text-3xl transform scale-0 group-hover:scale-100 transition-transform duration-300" />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
          <div className="space-y-6 md:space-y-8 mt-2 md:mt-6">
            {gameTimeToBeat && (
              <section className="bg-white/5 border border-white/10 rounded-2xl p-4 md:p-6 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 md:p-6 opacity-10 pointer-events-none">
                  <FaClock className="text-6xl md:text-8xl" />
                </div>
                <div className="relative z-10">
                  <h2 className="text-lg md:text-xl font-black mb-4 md:mb-6">
                    Playtime
                  </h2>
                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <p className="text-white/60 text-[10px] font-black uppercase tracking-widest -mt-2 md:-mt-4 mb-2 md:mb-3 border border-white/20 p-2 rounded-lg backdrop-blur-sm">
                        Please note that this data is contributed by the community (via <span className="text-white">IGDB</span>) and may not exactly reflect your personal playthroughs.
                      </p>
                    </div>
                    <div className="flex justify-between items-end border-b border-white/10 pb-3 md:pb-4">
                      <div className="flex flex-col">
                        <span className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-0.5 md:mb-1">Main Story</span>
                        <span className="text-sm md:text-base text-white font-bold">Standard Play</span>
                      </div>
                      <span className="text-xl md:text-2xl font-black text-primary-light">{gameTimeToBeat ? formatTime(gameTimeToBeat.normally) : "..."}</span>
                    </div>
                    <div className="flex justify-between items-end border-b border-white/10 pb-3 md:pb-4">
                      <div className="flex flex-col">
                        <span className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-0.5 md:mb-1">Fast Run</span>
                        <span className="text-sm md:text-base text-white font-bold">Rushed Play</span>
                      </div>
                      <span className="text-xl md:text-2xl font-black text-primary-light">{gameTimeToBeat ? formatTime(gameTimeToBeat.hastily) : "..."}</span>
                    </div>
                    <div className="flex justify-between items-end">
                      <div className="flex flex-col">
                        <span className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-0.5 md:mb-1">Completionist</span>
                        <span className="text-sm md:text-base text-white font-bold">100% Run</span>
                      </div>
                      <span className="text-xl md:text-2xl font-black text-primary-light">{gameTimeToBeat ? formatTime(gameTimeToBeat.completely) : "..."}</span>
                    </div>

                    {averagePlaytime && (
                      <div className="mt-4 pt-4 border-t border-white/10">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="size-10 rounded-lg bg-gradient-primary flex items-center justify-center">
                              <FaUsers size={23} />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-0.5 md:mb-1">Game Track users</span>
                              <span className="text-sm md:text-base text-white font-bold">Completed the game</span>
                            </div>
                          </div>
                          <span className="text-xl md:text-2xl font-black text-primary-light">
                            {averagePlaytime}h
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}
            <section className="bg-white/5 border border-white/10 rounded-2xl p-4 md:p-6 space-y-4 md:space-y-6 shadow-2xl ">
              <div>
                <h3 className="text-[10px] md:text-xs font-black uppercase text-primary-light mb-3 md:mb-4 flex items-center gap-2">
                  Developers
                </h3>
                <div className="flex flex-col gap-2 md:gap-3">
                  {game?.developers?.map((dev, i) => (
                    <a
                      key={i}
                      href={dev.link}
                      target="_blank"
                      rel="noreferrer"
                      className="text-base md:text-lg font-black transition flex items-center flex-row gap-2 hover:scale-105"
                    >
                      {he.decode(dev.name || "")}
                      <FaExternalLinkAlt className="text-[10px]" />
                    </a>
                  ))}
                </div>
              </div>
              <div className="pt-4 md:pt-6 border-t border-white/10">
                <h3 className="text-[10px] md:text-xs font-black uppercase text-primary-light mb-3 md:mb-4 flex items-center gap-2">
                  Publishers
                </h3>
                <div className="flex flex-col gap-2 md:gap-3">
                  {game?.editors?.map((editor, i) => (
                    <a
                      key={i}
                      href={editor.link}
                      target="_blank"
                      rel="noreferrer"
                      className="text-base md:text-lg font-black transition flex items-center flex-row gap-2 hover:scale-105"
                    >
                      {he.decode(editor.name || "")}
                      <FaExternalLinkAlt className="text-[10px]" />
                    </a>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </div>
        <AnimatePresence initial={false} custom={direction}>
          {selectedScreenshotIndex !== null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[999] bg-black/90 backdrop-blur-2xl flex items-center justify-center overflow-hidden"
            >
              <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="absolute top-8 right-8 text-white p-4 bg-black/40 backdrop-blur-md rounded-full hover:scale-110 transition shadow-2xl border border-white/10 z-[110]"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedScreenshotIndex(null);
                }}
              >
                <FiX className="text-xl" />
              </motion.button>
              {gameScreenshots.length > 1 && (
                <>
                  <button
                    className="absolute left-4 md:left-10 text-white p-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-full hover:bg-white/10 hover:scale-110 transition-all z-[110] shadow-2xl"
                    onClick={(e) => {
                      e.stopPropagation();
                      paginate(-1);
                    }}
                  >
                    <FaChevronLeft className="text-xl" />
                  </button>
                  <button
                    className="absolute right-4 md:right-10 text-white p-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-full hover:bg-white/10 hover:scale-110 transition-all z-[110] shadow-2xl"
                    onClick={(e) => {
                      e.stopPropagation();
                      paginate(1);
                    }}
                  >
                    <FaChevronRight className="text-xl" />
                  </button>
                </>
              )}
              <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden">
                <div className="relative w-full h-full flex items-center justify-center">
                  <AnimatePresence initial={false} custom={direction}>
                    <motion.div
                      key={selectedScreenshotIndex}
                      custom={direction}
                      variants={{
                        enter: (direction) => ({
                          x: direction > 0 ? '100%' : '-100%',
                          opacity: 0,
                        }),
                        center: {
                          zIndex: 1,
                          x: 0,
                          opacity: 1,
                        },
                        exit: (direction) => ({
                          zIndex: 0,
                          x: direction < 0 ? '100%' : '-100%',
                          opacity: 0,
                        })
                      }}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{
                        x: { type: "tween", duration: 0.3 },
                        opacity: { duration: 0.2 }
                      }}
                      drag="x"
                      dragConstraints={{ left: 0, right: 0 }}
                      dragElastic={1}
                      onDragEnd={(e, { offset, velocity }) => {
                        const swipe = swipePower(offset.x, velocity.x);
                        if (swipe < -swipeConfidenceThreshold) {
                          paginate(1);
                        } else if (swipe > swipeConfidenceThreshold) {
                          paginate(-1);
                        }
                      }}
                      className="absolute inset-0 flex items-center justify-center p-4 md:p-12 cursor-grab active:cursor-grabbing"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        {!galleryImageLoaded && (
                          <img src="loading.gif" alt="Loading..." className="w-16 h-16 opacity-40 animate-pulse" />
                        )}
                      </div>
                      <img
                        src={gameScreenshots[selectedScreenshotIndex]}
                        alt={`${game?.name || ""} screen gallery`}
                        className="max-w-full max-h-[75vh] md:max-h-[80vh] object-contain rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10 transition-opacity duration-300 pointer-events-none select-none"
                        style={{ opacity: galleryImageLoaded ? 1 : 0 }}
                        onLoad={() => setGalleryImageLoaded(true)}
                        onError={() => setGalleryImageLoaded(true)}
                      />
                    </motion.div>
                  </AnimatePresence>
                </div>
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white/5 backdrop-blur-md px-6 py-2 rounded-full border border-white/10 shadow-2xl flex items-center gap-3 z-[110]">
                  <span className="text-white/40 text-[10px] font-black uppercase tracking-widest">Screenshot</span>
                  <span className="text-white font-black">{selectedScreenshotIndex + 1} / {gameScreenshots.length}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <CompletionModal
          isOpen={completionModalOpen}
          onClose={() => setCompletionModalOpen(false)}
          gameName={game?.name || ""}
          mode={isToPlay ? 'transition' : 'update'}
          initialStatus={personalPlaytime?.status}
          initialHours={personalPlaytime?.hours}
          onConfirm={handleCompletionConfirm}
        />
        <ConfirmModal
          isOpen={confirmModalOpen}
          title="Warning"
          message="By removing the game from your Played list, your current playtimes will be lost"
          confirmText="Remove"
          onConfirm={handleConfirmRemove}
          onCancel={() => setConfirmModalOpen(false)}
        />
      </div>
    </Layout>
  );
}
