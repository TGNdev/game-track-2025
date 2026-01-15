import { useEffect } from "react";
import GamesView from "../components/games/GamesView"
import Layout from "../components/shared/Layout";
import { getGameCovers, getGameScreenshots, getGameTimeToBeat } from "../js/igdb";
import { useGameData } from "../contexts/GameDataContext";

const Home = () => {
  const {
    games,
    setCoverMap,
    setScreenshotsMap,
    setTimesToBeat,
  } = useGameData();

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

  return (
    <Layout>
      <GamesView />
    </Layout>
  );
};

export default Home;
