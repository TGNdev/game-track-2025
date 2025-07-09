const TTL = 1000 * 60 * 60 * 24 * 10;

export const getCachedValue = (key) => {
  const item = localStorage.getItem(key);
  if (!item) return null;

  try {
    const { value, expiresAt } = JSON.parse(item);
    if (Date.now() > expiresAt) {
      localStorage.removeItem(key);
      return null;
    }
    return value;
  } catch {
    localStorage.removeItem(key);
    return null;
  }
};

export const setCachedValue = (key, value) => {
  const expiresAt = Date.now() + TTL;
  localStorage.setItem(key, JSON.stringify({ value, expiresAt }));
};
