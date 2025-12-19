const TTL = 1000 * 60 * 60 * 24 * 3;

export const getCachedValue = (id, field) => {
  const item = localStorage.getItem(id);
  if (!item) return null;

  try {
    const { data, expiresAt } = JSON.parse(item);
    if (Date.now() > expiresAt) {
      localStorage.removeItem(id);
      return null;
    }
    return data[field] ?? null;
  } catch {
    localStorage.removeItem(id);
    return null;
  }
};

export const setCachedValue = (id, field, value) => {
  const item = localStorage.getItem(id);
  const expiresAt = Date.now() + TTL;

  let data = {};
  try {
    if (item) {
      const parsed = JSON.parse(item);

      if (parsed.expiresAt > Date.now()) {
        data = parsed.data || {};
      }
    }
  } catch {
    // fallback to empty data
  }

  data[field] = value;

  localStorage.setItem(
    id,
    JSON.stringify({
      data,
      expiresAt
    })
  );
};
