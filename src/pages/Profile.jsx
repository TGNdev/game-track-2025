import { useAuth } from "../contexts/AuthContext";
import { useGameData } from "../contexts/GameDataContext";
import Layout from "../components/shared/Layout";
import { Navigate } from "react-router-dom";
import { useEffect, useMemo } from "react";
import { getGameCovers } from "../js/igdb";
import { useNavigate } from "react-router-dom";
import { slugify } from "../js/utils";
import { FiHome } from "react-icons/fi";
import { FaExternalLinkAlt, FaClock, FaPlus } from "react-icons/fa";
import { removeFromLibrary, removeCountdown } from "../js/firebase";
import { toast } from "react-toastify";
import CountdownTimer from "../components/shared/CountdownTimer";
import ScrollContainer from "react-indiana-drag-scroll";

const Profile = () => {
  const navigate = useNavigate();
  const { userData, currentUser } = useAuth();
  const { games, coverMap, setCoverMap } = useGameData();

  const libraryGames = useMemo(() => {
    if (!userData?.library || games.length === 0) return [];
    return games
      .filter(g => userData.library.includes(g.id))
      .sort((a, b) => (b.release_date?.seconds || 0) - (a.release_date?.seconds || 0));
  }, [userData?.library, games]);

  const handleRemoveFromLibrary = (gameId) => {
    removeFromLibrary(currentUser.uid, gameId);
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
    const allGamesWithCovers = [...libraryGames, ...countdowns];
    if (allGamesWithCovers.length > 0) {
      const fetchCovers = async () => {
        const gameIds = allGamesWithCovers.map((g) => g.igdb_id);
        const covers = await getGameCovers(gameIds);
        setCoverMap(covers);
      };
      fetchCovers();
    }
  }, [libraryGames, countdowns, setCoverMap]);

  if (!currentUser) return <Navigate to="/" />;

  return (
    <Layout>
      <div className="mx-6 mt-6 flex flex-col gap-20">
        <section>
          <div
            className="flex items-center gap-4 p-4 rounded-xl mb-6 bg-white/5"
          >
            <div className="p-2 rounded-lg bg-gradient-primary">
              <FiHome className="size-5" />
            </div>
            <h3 className="text-xl font-bold">Library</h3>
          </div>
          {libraryGames.length > 0 ? (
            <ScrollContainer
              className="flex gap-6 pb-6 w-full cursor-grab active:cursor-grabbing"
              horizontal={true}
              vertical={false}
              ignoreElements="button, a"
            >
              {libraryGames.map(game => (
                <div key={game.id} className="w-60 h-auto shrink-0 rounded-xl shadow-sm text-center flex flex-col items-center border-primary">
                  <img
                    src={coverMap[game?.igdb_id]}
                    alt={game.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <h4 className="px-4 font-bold text-sm mb-2 line-clamp-1 pt-4">{game.name}</h4>
                  <div className="flex gap-2">
                    <button
                      className="bg-gradient-primary py-1.5 px-2 rounded-lg my-2"
                      onClick={() => navigate(`/games/${slugify(game.name)}`)}
                    >
                      <FaExternalLinkAlt className="size-4" />
                    </button>
                    <button
                      className="bg-gradient-primary py-1.5 px-2 rounded-lg my-2"
                      onClick={() => handleRemoveFromLibrary(game.id)}
                    >
                      <FaPlus className="size-4 rotate-45" />
                    </button>
                  </div>
                </div>
              ))}
            </ScrollContainer>
          ) : (
            <div className="bg-white/5 rounded-2xl p-12 border-white/10 flex flex-col gap-2 justify-center items-center">
              <p className="text-white/80">Your library is empty !</p>
              <p className="text-white/60 text-sm">Start building your library from any game details page !</p>
            </div>
          )}
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
            <ScrollContainer
              className="flex gap-6 pb-6 w-full cursor-grab active:cursor-grabbing"
              horizontal={true}
              vertical={false}
              ignoreElements="button, a"
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
                    <h4 className="px-4 font-bold text-sm mb-2 line-clamp-1">{game.name}</h4>
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
            </ScrollContainer>
          ) : (
            <div className="bg-white/5 rounded-2xl p-12 border-white/10 flex flex-col gap-2 justify-center items-center">
              <p className="text-white/80">No countdowns added yet !</p>
              <p className="text-white/60 text-sm">Get hyped and add countdowns from any game details page !</p>
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
};

export default Profile;
