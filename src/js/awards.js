export function createGamesMap(games) {
  const map = {};
  games.forEach(game => {
    map[game.id] = game;
  });
  return map;
}

export function mergeTgaWithGames(tgaList, games) {
  const gamesMap = createGamesMap(games);

  return tgaList.map(tga => {
    const mergedAwards = {};

    for (const [categoryKey, categoryData] of Object.entries(tga.awards || {})) {
      if (Array.isArray(categoryData)) {
        mergedAwards[categoryKey] = categoryData.map(entry => ({
          ...entry,
          game: entry.gameId ? gamesMap[entry.gameId] || null : null,
        }));
      } else if (typeof categoryData === 'object' && categoryData?.gameId) {
        mergedAwards[categoryKey] = {
          ...categoryData,
          game: gamesMap[categoryData.gameId] || null,
        };
      } else {
        mergedAwards[categoryKey] = categoryData;
      }
    }

    return {
      ...tga,
      mergedResults: mergedAwards,
    };
  });
}