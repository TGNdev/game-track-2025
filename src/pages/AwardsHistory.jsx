// AwardsHistory.jsx
import { useEffect, useState } from "react";
import Layout from "../components/shared/Layout";
import { getGamesFromFirestore, getTgaFromFirestore } from "../js/firebase";
import YearSelector from "../components/awards_history/YearSelector";
import AwardSelector from "../components/awards_history/AwardSelector";
import NomineesList from "../components/awards_history/NomineesList";

const AwardsHistory = () => {
  const [games, setGames] = useState([]);
  const [tga, setTga] = useState([]);
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedAward, setSelectedAward] = useState(null);

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

  const getGameById = (id) => games.find((g) => g.id === id);

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-4">Game Awards History</h2>

        {!selectedYear && (
          <YearSelector tga={tga} onSelectYear={setSelectedYear} />
        )}

        {selectedYear && !selectedAward && (
          <AwardSelector
            year={selectedYear}
            onBack={() => setSelectedYear(null)}
            onSelectAward={setSelectedAward}
          />
        )}

        {selectedAward && (
          <NomineesList
            award={selectedAward}
            getGameById={getGameById}
            onBackToAwards={() => setSelectedAward(null)}
            onBackToYears={() => {
              setSelectedAward(null);
              setSelectedYear(null);
            }}
          />
        )}
      </div>
    </Layout>
  );
};

export default AwardsHistory;
