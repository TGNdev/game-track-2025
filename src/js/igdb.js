import { getCachedValue, setCachedValue } from "./cache";

export const getGameCovers = async (gameIds) => {
    const coverMap = {};
    const uncachedIds = [];

    for (const id of gameIds) {
        const cached = getCachedValue(`cover_${id}`);
        if (cached) {
            coverMap[id] = cached;
        } else {
            uncachedIds.push(id);
        }
    }

    if (uncachedIds.length > 0) {
        const query = `fields id, cover.image_id; where id = (${uncachedIds.join(",")}); limit ${uncachedIds.length};`;

        const res = await fetch("/api/igdb", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query }),
        });

        const data = await res.json();

        data.forEach((game) => {
            if (game.cover) {
                const url = `https://images.igdb.com/igdb/image/upload/t_cover_big/${game.cover.image_id}.jpg`;
                coverMap[game.id] = url;
                setCachedValue(`cover_${game.id}`, url);
            }
        });
    }

    return coverMap;
};

export const getGameScreenshots = async (gameIds) => {
    const screenshotMap = {};
    const uncachedIds = [];

    for (const id of gameIds) {
        const cached = getCachedValue(`screenshots_${id}`);
        if (cached) {
            screenshotMap[id] = cached;
        } else {
            uncachedIds.push(id);
        }
    }

    if (uncachedIds.length > 0) {
        const query = `fields id, screenshots.image_id; where id = (${uncachedIds.join(",")}); limit ${uncachedIds.length};`;

        const res = await fetch("/api/igdb", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query }),
        });

        const data = await res.json();

        data.forEach((game) => {
            if (game.screenshots?.length > 0) {
                const urls = game.screenshots.map(
                    (s) => `https://images.igdb.com/igdb/image/upload/t_screenshot_big/${s.image_id}.jpg`
                );
                screenshotMap[game.id] = urls;
                setCachedValue(`screenshots_${game.id}`, urls);
            }
        });
    }

    return screenshotMap;
};