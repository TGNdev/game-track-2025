let cache = {};
let igdbToken = {
  access_token: null,
  expires_at: 0,
};

const getToken = async () => {
  const now = Math.floor(Date.now() / 1000);

  if (igdbToken.access_token && now < igdbToken.expires_at - 60) {
    return igdbToken.access_token;
  }

  const res = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.REACT_APP_IGDB_CLIENT,
      client_secret: process.env.REACT_APP_IGDB_SECRET,
      grant_type: "client_credentials",
    }),
  });

  if (!res.ok) {
    throw new Error("Failed to fetch IGDB token");
  }

  const data = await res.json();

  igdbToken = {
    access_token: data.access_token,
    expires_at: now + data.expires_in,
  };

  return igdbToken.access_token;
};

export async function handler(event) {
  try {
    const { query } = JSON.parse(event.body || "{}");
    if (!query) return { statusCode: 400, body: "Missing query" };

    const cacheKey = query.trim();
    if (cache[cacheKey]) {
      console.log("Response from cache !");
      return {
        statusCode: 200,
        body: JSON.stringify(cache[cacheKey]),
      };
    }

    const token = await getToken();

    const res = await fetch("https://api.igdb.com/v4/games", {
      method: "POST",
      headers: {
        "Client-ID": process.env.REACT_APP_IGDB_CLIENT,
        Authorization: `Bearer ${token}`,
        "Content-Type": "text/plain",
      },
      body: query,
    });

    if (!res.ok) {
      return {
        statusCode: res.status,
        body: await res.text(),
      };
    }

    const data = await res.json();
    cache[cacheKey] = data;

    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: `Server Error: ${err.message}`,
    };
  }
}