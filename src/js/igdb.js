export const getGameCovers = async (gameIds) => {
    const query = `fields id, cover.image_id; where id = (${gameIds.join(",")}); limit ${gameIds.length};`;
    const res = await fetch("/api/igdb", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
    });

    const data = await res.json();
    const coverMap = {};

    data.forEach((game) => {
        if (game.cover) {
            coverMap[game.id] = `https://images.igdb.com/igdb/image/upload/t_cover_big/${game.cover.image_id}.jpg`;
        }
    });

    return coverMap;
};

export const getGameScreenshots = async (gameIds) => {
    const query = `fields id, screenshots.image_id; where id = (${gameIds.join(",")}); limit ${gameIds.length};`;

    const res = await fetch("/api/igdb", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
    });

    if (!res.ok) {
        throw new Error("Failed to fetch screenshots");
    }

    const data = await res.json();
    const screenshotMap = {};

    data.forEach((game) => {
        if (game.screenshots && game.screenshots.length > 0) {
            screenshotMap[game.id] = game.screenshots.map(
                (screenshot) => `https://images.igdb.com/igdb/image/upload/t_720p/${screenshot.image_id}.jpg`
            );
        }
    });
    console.log(screenshotMap);

    return screenshotMap;
}