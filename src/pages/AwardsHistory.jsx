import { useEffect, useState } from "react";
import Layout from "../components/shared/Layout";
import { getGamesFromFirestore, getTgaFromFirestore } from "../js/firebase";
import YearSelector from "../components/awards_history/YearSelector";
import AwardSelector from "../components/awards_history/AwardSelector";
import NomineesList from "../components/awards_history/NomineesList";
import { useNavigate, useParams } from "react-router";
import Breadcrumbs from "../components/awards_history/Breadcrumbs";
import { slugify } from "../js/utils";
import { useGame } from "../contexts/GameContext";
import { getGameCovers } from "../js/igdb";


const AwardsHistory = () => {
  const { year, awardId } = useParams();
  const navigate = useNavigate();

  const [games, setGames] = useState([]);
  const [tga, setTga] = useState([]);
  const [selectedYearNumber, setSelectedYearNumber] = useState(year ? parseInt(year) : null);
  const {
    coverMap, setCoverMap,
  } = useGame();

  const selectedYearObj = tga.find((y) => y.year === selectedYearNumber) || null;
  const awardSlug = awardId;
  const selectedAward =
    selectedYearObj?.awards.find(
      (a) => slugify(a.title) === awardSlug
    ) || null;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [gamesList, tgaList] = await Promise.all([
          getGamesFromFirestore(),
          getTgaFromFirestore(),
        ]);
        tgaList.sort((a, b) => b.year - a.year);
        setGames(gamesList);
        setTga(tgaList);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

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
    setSelectedYearNumber(year ? parseInt(year) : null);
  }, [year]);

  const getGameById = (id) => games.find((g) => g.id === id);

  const handleSelectYear = (selectedYearObj) => navigate(`/game-awards-history/${selectedYearObj.year}`);
  const handleSelectAward = (award) => navigate(`/game-awards-history/${selectedYearNumber}/${slugify(award.title)}`);

  return (
    <Layout>
      <div className="max-w-5xl mx-auto mt-6">
        <h2 className="text-2xl font-bold text-center mb-4">Game Awards History</h2>
        <Breadcrumbs />

        {!selectedYearNumber && (
          <YearSelector tga={tga} getGameById={getGameById} onSelectYear={handleSelectYear} />
        )}

        {selectedYearObj && !selectedAward && (
          <AwardSelector
            year={selectedYearObj}
            onBack={() => navigate("/game-awards-history")}
            onSelectAward={handleSelectAward}
          />
        )}

        {selectedAward && (
          <NomineesList
            award={selectedAward}
            getGameById={getGameById}
            onBackToAwards={() => navigate(`/game-awards-history/${selectedYearNumber}`)}
            onBackToYears={() => navigate("/game-awards-history")}
            coverMap={coverMap}
          />
        )}
      </div>
    </Layout>
  );
};

export default AwardsHistory;
