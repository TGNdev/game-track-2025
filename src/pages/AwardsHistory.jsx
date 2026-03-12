import { useEffect, useState } from "react";
import Layout from "../components/shared/Layout";
import { getTgaFromFirestore } from "../js/firebase";
import YearSelector from "../components/awards_history/YearSelector";
import AwardSelector from "../components/awards_history/AwardSelector";
import NomineesList from "../components/awards_history/NomineesList";
import { useNavigate, useParams } from "react-router";
import Breadcrumbs from "../components/awards_history/Breadcrumbs";
import { slugify } from "../js/utils";
import { getGameCovers } from "../js/igdb";
import { useGameData } from "../contexts/GameDataContext";
import { FaMedal } from "react-icons/fa";
import Leaderboard from "../components/awards_history/Leaderboard";
const AwardsHistory = () => {
  const { year, awardId } = useParams();
  const navigate = useNavigate();

  const [tga, setTga] = useState([]);
  const [selectedYearNumber, setSelectedYearNumber] = useState(year === 'leaderboard' ? 'leaderboard' : (year ? parseInt(year) : null));
  const {
    coverMap, setCoverMap,
    games
  } = useGameData();

  const selectedYearObj = selectedYearNumber === 'leaderboard' ? null : (tga.find((y) => y.year === selectedYearNumber) || null);
  const awardSlug = awardId;
  const selectedAward =
    selectedYearObj?.awards.find(
      (a) => slugify(a.title) === awardSlug
    ) || null;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tgaList] = await Promise.all([
          getTgaFromFirestore(),
        ]);
        tgaList.sort((a, b) => b.year - a.year);
        setTga(tgaList);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

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
    setSelectedYearNumber(year === 'leaderboard' ? 'leaderboard' : (year ? parseInt(year) : null));
  }, [year]);

  const getGameById = (id) => games.find((g) => g.id === id);

  const handleSelectYear = (selectedYearObj) => navigate(`/game-awards-history/${selectedYearObj.year}`);
  const handleSelectAward = (award) => navigate(`/game-awards-history/${selectedYearNumber}/${slugify(award.title)}`);

  return (
    <Layout>
      <div className="max-w-[1400px] mx-auto px-6 pb-12 md:py-20 space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
              Game Awards History
            </h1>
            <p className="text-white/40 font-medium max-w-xl text-lg leading-relaxed">
              Discover the history of the Game Awards, from the first annual ceremony in 2015 to the most recent awards.
            </p>
          </div>
          {year !== 'leaderboard' && (
            <button
              onClick={() => navigate('/game-awards-history/leaderboard')}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-2xl text-white font-bold transition-all shadow-xl flex items-center justify-center gap-2 group whitespace-nowrap"
            >
              <FaMedal className="text-yellow-400 group-hover:scale-110 transition-transform" />
              View Leaderboard
            </button>
          )}
        </div>
        <Breadcrumbs tga={tga} />

        {selectedYearNumber === 'leaderboard' && (
          <Leaderboard tga={tga} getGameById={getGameById} coverMap={coverMap} />
        )}

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
            awardYear={selectedYearNumber}
          />
        )}
      </div>
    </Layout>
  );
};

export default AwardsHistory;
