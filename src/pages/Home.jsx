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
    let isMounted = true;
    const fetchCovers = async () => {
      if (games.length === 0) return;
      const gameIds = [...new Set(games.map((g) => g.igdb_id).filter(id => id != null))];
      await getGameCovers(gameIds, (batch) => {
        if (isMounted) {
          setCoverMap(prev => ({ ...prev, ...batch }));
        }
      });
    };
    fetchCovers();
    return () => { isMounted = false; };
  }, [games, setCoverMap]);

  useEffect(() => {
    let isMounted = true;
    const fetchScreenshots = async () => {
      if (games.length === 0) return;
      const gameIds = [...new Set(games.map((g) => g.igdb_id).filter(id => id != null))];
      await getGameScreenshots(gameIds, (batch) => {
        if (isMounted) {
          setScreenshotsMap(prev => ({ ...prev, ...batch }));
        }
      });
    };
    fetchScreenshots();
    return () => { isMounted = false; };
  }, [games, setScreenshotsMap]);

  useEffect(() => {
    let isMounted = true;
    const fetchTimesToBeat = async () => {
      if (games.length === 0) return;
      const gameIds = [...new Set(games.map((g) => g.igdb_id).filter(id => id != null))];
      await getGameTimeToBeat(gameIds, (batch) => {
        if (isMounted) {
          setTimesToBeat(prev => ({ ...prev, ...batch }));
        }
      });
    };
    fetchTimesToBeat();
    return () => { isMounted = false; };
  }, [games, setTimesToBeat]);

  return (
    <Layout>
      <GamesView />
    </Layout>
  );
};

export default Home;
