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
        const BATCH_SIZE = 100;
        for (let i = 0; i < uncachedIds.length; i += BATCH_SIZE) {
            const batch = uncachedIds.slice(i, i + BATCH_SIZE);
            const query = `fields id, cover.image_id; where id = (${batch.join(",")}); limit ${batch.length};`;

            try {
                const res = await fetch("/api/igdb", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        query,
                        destination: "igdb",
                        endpoint: "games",
                    }),
                });

                if (!res.ok) continue;

                const data = await res.json();

                if (Array.isArray(data)) {
                    data.forEach((game) => {
                        if (game.cover) {
                            const url = `https://images.igdb.com/igdb/image/upload/t_cover_big/${game.cover.image_id}.jpg`;
                            coverMap[game.id] = url;
                            setCachedValue(game.id, "cover", url);
                        }
                    });
                }
            } catch (err) {
                console.error("Error fetching covers batch:", err);
            }
        }
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
        const BATCH_SIZE = 100;
        for (let i = 0; i < uncachedIds.length; i += BATCH_SIZE) {
            const batch = uncachedIds.slice(i, i + BATCH_SIZE);
            const query = `fields id, screenshots.image_id; where id = (${batch.join(",")}); limit ${batch.length};`;

            try {
                const res = await fetch("/api/igdb", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        query,
                        destination: "igdb",
                        endpoint: "games",
                    }),
                });

                if (!res.ok) continue;

                const data = await res.json();

                if (Array.isArray(data)) {
                    data.forEach((game) => {
                        if (game.screenshots?.length > 0) {
                            const urls = game.screenshots.map(
                                (s) => `https://images.igdb.com/igdb/image/upload/t_1080p/${s.image_id}.jpg`
                            );
                            screenshotMap[game.id] = urls;
                            setCachedValue(game.id, "screenshots", urls);
                        }
                    });
                }
            } catch (err) {
                console.error("Error fetching screenshots batch:", err);
            }
        }
    }

    return screenshotMap;
};

export const getGameVideos = async (gameIds) => {
    const videoMap = {};
    const uncachedIds = [];

    for (const id of gameIds) {
        const cached = getCachedValue(id, "videos");
        if (cached) {
            videoMap[id] = cached;
        } else {
            uncachedIds.push(id);
        }
    }

    if (uncachedIds.length > 0) {
        const BATCH_SIZE = 100;
        for (let i = 0; i < uncachedIds.length; i += BATCH_SIZE) {
            const batch = uncachedIds.slice(i, i + BATCH_SIZE);
            const query = `fields id, videos.video_id, videos.name; where id = (${batch.join(",")}); limit ${batch.length};`;

            try {
                const res = await fetch("/api/igdb", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        query,
                        destination: "igdb",
                        endpoint: "games",
                    }),
                });

                if (!res.ok) continue;

                const data = await res.json();

                if (Array.isArray(data)) {
                    data.forEach((game) => {
                        if (game.videos?.length > 0) {
                            videoMap[game.id] = game.videos;
                            setCachedValue(game.id, "videos", game.videos);
                        }
                    });
                }
            } catch (err) {
                console.error("Error fetching videos batch:", err);
            }
        }
    }

    return videoMap;
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
        const BATCH_SIZE = 100;
        for (let i = 0; i < uncachedIds.length; i += BATCH_SIZE) {
            const batch = uncachedIds.slice(i, i + BATCH_SIZE);
            const query = `fields game_id, completely, hastily, normally; where game_id = (${batch.join(",")}); limit ${batch.length};`;

            try {
                const res = await fetch("/api/igdb", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        query,
                        destination: "igdb",
                        endpoint: "game_time_to_beats",
                    }),
                });

                if (!res.ok) continue;

                const data = await res.json();

                if (Array.isArray(data)) {
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
            } catch (err) {
                console.error("Error fetching time-to-beat batch:", err);
            }
        }
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

export const getIGDBEvents = async () => {
    const cached = getCachedValue("igdb_events", "all");
    if (cached) return cached;

    const query = `fields name, description, event_logo.image_id, live_stream_url, start_time, end_time; limit 500; sort start_time desc;`;

    const res = await fetch("/api/igdb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            query,
            destination: "igdb",
            endpoint: "events",
        }),
    });

    if (!res.ok) {
        return [];
    }

    const data = await res.json();
    setCachedValue("igdb_events", "all", data);
    return data;
};