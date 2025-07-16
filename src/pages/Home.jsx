import { useEffect } from "react";
import { ToastContainer } from "react-toastify";
import GamesView from "../components/games/GamesView"
import { useGame } from "../contexts/GameContext";
import Layout from "../components/shared/Layout";
import { getGamesFromFirestore } from "../js/firebase";
import { getGameCovers, getGameScreenshots } from "../js/igdb";

const Home = () => {
  const {
    games, setGames,
    setCoverMap,
    setScreenshotsMap,
    setLoading
  } = useGame();

  useEffect(() => {
    const fetchGames = async () => {
      try {
        setLoading(true);
        const gamesList = (await getGamesFromFirestore());
        setGames(gamesList);
      } catch (error) {
        console.error("Error fetching games:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchGames();
  }, [setLoading, setGames]);

  useEffect(() => {
    const fetchCovers = async () => {
      if (games.length === 0) return;
      const gameIds = games.map((g) => g.igdb_id);
      const covers = await getGameCovers(gameIds);
      setCoverMap(covers);
    };
    fetchCovers();
  }, [games, setCoverMap]);

  useEffect(() => {
    const fetchScreenshots = async () => {
      if (games.length === 0) return;
      const gameIds = games.map((g) => g.igdb_id);
      const screenshots = await getGameScreenshots(gameIds);
      setScreenshotsMap(screenshots);
    };
    fetchScreenshots();
  }, [games, setScreenshotsMap]);

  return (
    <Layout>
      <GamesView />
      <ToastContainer position="top-right" autoClose={3000} />
    </Layout>
  );
};

export default Home;
