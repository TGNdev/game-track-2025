import { useEffect } from "react";
import { ToastContainer } from "react-toastify";
import GamesView from "../components/games/GamesView"
import { useGame } from "../contexts/GameContext";
import Layout from "../components/shared/Layout";
import { getGamesFromFirestore, getTgaFromFirestore } from "../js/firebase";
import { getGameCovers, getGameScreenshots, getGameTimeToBeat } from "../js/igdb";
import { getCachedValue, setCachedValue } from "../js/cache";

const Home = () => {
  const {
    games, setGames,
    setCoverMap,
    setScreenshotsMap,
    setLoading,
    setTimesToBeat,
    setAwardWinners
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

  useEffect(() => {
    const fetchTimesToBeat = async () => {
      if (games.length === 0) return;
      const gameIds = games.map((g) => g.igdb_id);
      const timesToBeat = await getGameTimeToBeat(gameIds);
      setTimesToBeat(timesToBeat);
    };
    fetchTimesToBeat();
  }, [games, setTimesToBeat]);

  useEffect(() => {
    const fetchAwardWinners = async () => {
      if (games.length === 0) return;
  
      const CACHE_KEY = "tga_awards";
      const cachedWinners = getCachedValue(CACHE_KEY, "winners");
  
      if (cachedWinners) {
        setAwardWinners(new Set(cachedWinners));
        return;
      }
  
      try {
        const tgaData = await getTgaFromFirestore();
        const winners = [];
  
        for (const yearEntry of tgaData) {
          for (const award of yearEntry.awards || []) {
            for (const nominee of award.nominees || []) {
              if (nominee.isWinner) {
                winners.push(nominee.gameId);
              }
            }
          }
        }
  
        setAwardWinners(new Set(winners));
        setCachedValue(CACHE_KEY, "winners", winners);
      } catch (err) {
        console.error("Error loading TGA winners", err);
      }
    };
  
    fetchAwardWinners();
  }, [games, setAwardWinners]);

  return (
    <Layout>
      <GamesView />
      <ToastContainer position="top-right" autoClose={3000} />
    </Layout>
  );
};

export default Home;
