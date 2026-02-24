import Parser from "rss-parser";
import admin from "firebase-admin";

const parser = new Parser();

const STOP_WORDS = new Set(["the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "with", "by", "about", "as", "of", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "do", "does", "did", "out", "up", "down", "off", "over", "under", "again", "further", "then", "once", "here", "there", "when", "where", "why", "how", "all", "any", "both", "each", "few", "more", "most", "other", "some", "such", "no", "nor", "not", "only", "own", "same", "so", "than", "too", "very", "s", "t", "can", "will", "just", "don", "should", "now", "new", "first", "game", "games", "review", "trailer", "gameplay"]);

function getWords(text) {
    return text
        .toLowerCase()
        .replace(/[^\w\s]/gi, '')
        .split(/\s+/)
        .filter(w => w.length > 2 && !STOP_WORDS.has(w));
}

function calculateSimilarity(title1, title2) {
    const set1 = new Set(getWords(title1));
    const set2 = new Set(getWords(title2));

    if (set1.size === 0 && set2.size === 0) return 0;

    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return intersection.size / union.size;
}

const SOURCES = [
    { name: "IGN", url: "https://feeds.feedburner.com/ign/news" },
    { name: "Kotaku", url: "https://kotaku.com/rss" },
    { name: "Polygon", url: "https://www.polygon.com/rss/index.xml" },
    { name: "GameSpot", url: "https://www.gamespot.com/feeds/news/" }
];

export const handler = async (event, context) => {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        // Initialize Firebase Admin if not already initialized
        if (!admin.apps.length) {
            if (process.env.FIREBASE_SERVICE_ACCOUNT) {
                admin.initializeApp({
                    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
                });
            } else {
                console.warn("FIREBASE_SERVICE_ACCOUNT not set. Skipping.");
                return { statusCode: 500, body: "FIREBASE_SERVICE_ACCOUNT missing" };
            }
        }

        const db = admin.firestore();

        // Fetch new articles
        let newArticles = [];
        for (const source of SOURCES) {
            try {
                const feed = await parser.parseURL(source.url);
                // Get the 15 most recent items from each source
                feed.items.slice(0, 15).forEach(item => {
                    newArticles.push({
                        source: source.name,
                        title: item.title,
                        link: item.link,
                        summary: (item.contentSnippet || item.content || item.description || "").replace(/<[^>]*>?/gm, '').substring(0, 300),
                        pubDate: new Date(item.pubDate || item.isoDate).toISOString()
                    });
                });
            } catch (e) {
                console.error(`Error fetching ${source.name}:`, e);
            }
        }

        // Sort new articles from oldest to newest to build stories chronologically
        newArticles.sort((a, b) => new Date(a.pubDate).getTime() - new Date(b.pubDate).getTime());

        // Fetch existing recent stories (last 3 days) to group into
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

        const storiesRef = db.collection("watchStories");
        const snapshot = await storiesRef.where("updatedAt", ">=", threeDaysAgo.toISOString()).get();

        let existingStories = [];
        snapshot.forEach(doc => {
            existingStories.push({ id: doc.id, ...doc.data() });
        });

        let addedCount = 0;
        let groupedCount = 0;

        for (const article of newArticles) {
            // Skip if article link already exists in any story
            let alreadyExists = false;
            for (const story of existingStories) {
                if (story.articles.some(a => a.link === article.link)) {
                    alreadyExists = true; break;
                }
            }
            if (alreadyExists) continue;

            // Find best matching story
            let bestMatch = null;
            let highestSimilarity = 0;

            for (const story of existingStories) {
                // Compare against the main story title AND against each article's title
                let maxSimForStory = calculateSimilarity(story.title, article.title);
                for (const a of story.articles) {
                    const sim = calculateSimilarity(a.title, article.title);
                    if (sim > maxSimForStory) maxSimForStory = sim;
                }

                if (maxSimForStory > highestSimilarity) {
                    highestSimilarity = maxSimForStory;
                    bestMatch = story;
                }
            }

            // 35% word overlap threshold for similarity
            if (bestMatch && highestSimilarity > 0.35) {
                // Add to existing story
                bestMatch.articles.push(article);
                bestMatch.updatedAt = new Date().toISOString();

                await storiesRef.doc(bestMatch.id).update({
                    articles: bestMatch.articles,
                    updatedAt: bestMatch.updatedAt
                });
                groupedCount++;
            } else {
                // Create new story
                const newStory = {
                    title: article.title, // Primary title
                    summary: article.summary,
                    createdAt: article.pubDate,
                    updatedAt: new Date().toISOString(),
                    articles: [article],
                    isLegacy: false // to distinguish from custom watch entries
                };

                const docRef = await storiesRef.add(newStory);
                existingStories.push({ id: docRef.id, ...newStory });
                addedCount++;
            }
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Sync complete", addedCount, groupedCount })
        };
    } catch (err) {
        console.error("Sync Error:", err);
        return { statusCode: 500, body: err.toString() };
    }
};
