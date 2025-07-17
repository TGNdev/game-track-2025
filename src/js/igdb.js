import { getCachedValue, setCachedValue } from "./cache";

export const getGameCovers = async (gameIds) => {
    const coverMap = {};
    const uncachedIds = [];

    for (const id of gameIds) {
        const cached = getCachedValue(id, "cover");
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
            body: JSON.stringify({
                query,
                destination: "igdb",
                endpoint: "games",
            }),
        });

        const data = await res.json();

        data.forEach((game) => {
            if (game.cover) {
                const url = `https://images.igdb.com/igdb/image/upload/t_cover_big/${game.cover.image_id}.jpg`;
                coverMap[game.id] = url;
                setCachedValue(game.id, "cover", url);
            }
        });
    }

    return coverMap;
};

export const getGameScreenshots = async (gameIds) => {
    const screenshotMap = {};
    const uncachedIds = [];

    for (const id of gameIds) {
        const cached = getCachedValue(id, "screenshots");
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
            body: JSON.stringify({
                query,
                destination: "igdb",
                endpoint: "games",
            }),
        });

        const data = await res.json();

        data.forEach((game) => {
            if (game.screenshots?.length > 0) {
                const urls = game.screenshots.map(
                    (s) => `https://images.igdb.com/igdb/image/upload/t_screenshot_big/${s.image_id}.jpg`
                );
                screenshotMap[game.id] = urls;
                setCachedValue(game.id, "screenshots", urls);
            }
        });
    }

    return screenshotMap;
};

export const getGameTimeToBeat = async (gameIds) => {
    const timeToBeatMap = {};
    const uncachedIds = [];

    for (const id of gameIds) {
        const cached = getCachedValue(id, "time_to_beat");
        if (cached) {
            timeToBeatMap[id] = cached;
        } else {
            uncachedIds.push(id);
        }
    }

    if (uncachedIds.length > 0) {
        const query = `fields game_id, completely, hastily, normally; where game_id = (${uncachedIds.join(",")}); limit ${uncachedIds.length};`;

        const res = await fetch("/api/igdb", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                query,
                destination: "igdb",
                endpoint: "game_time_to_beats",
            }),
        });

        const data = await res.json();

        data.forEach((entry) => {
            if (
                entry &&
                (entry.completely !== undefined ||
                    entry.hastily !== undefined ||
                    entry.normally !== undefined)
            ) {
                const timeToBeat = {
                    completely: entry.completely,
                    hastily: entry.hastily,
                    normally: entry.normally,
                };

                timeToBeatMap[entry.game_id] = timeToBeat;
                setCachedValue(entry.game_id, "time_to_beat", timeToBeat);
            }
        });
    }

    return timeToBeatMap;
};


export const getRedditPosts = async (limit) => {
    const res = await fetch("/api/igdb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            limit,
            destination: "reddit",
        }),
    });

    const data = await res.json();

    return data;
}