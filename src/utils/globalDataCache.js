const cacheStore = new Map();
const inFlightStore = new Map();

const now = () => Date.now();

export const readGlobalDataCache = (key) => {
  const entry = cacheStore.get(key);
  if (!entry) return null;

  if (entry.expiresAt <= now()) {
    cacheStore.delete(key);
    return null;
  }

  return entry.value;
};

export const writeGlobalDataCache = (key, value, ttlMs = 15000) => {
  cacheStore.set(key, {
    value,
    expiresAt: now() + Math.max(0, Number(ttlMs) || 0),
  });
  return value;
};

export const clearGlobalDataCache = (key) => {
  cacheStore.delete(key);
  inFlightStore.delete(key);
};

export const clearGlobalDataCacheByPrefix = (prefix) => {
  Array.from(cacheStore.keys())
    .filter((key) => key.startsWith(prefix))
    .forEach((key) => cacheStore.delete(key));

  Array.from(inFlightStore.keys())
    .filter((key) => key.startsWith(prefix))
    .forEach((key) => inFlightStore.delete(key));
};

export const getOrFetchGlobalData = async (
  key,
  fetcher,
  {ttlMs = 15000, forceRefresh = false} = {},
) => {
  if (!forceRefresh) {
    const cached = readGlobalDataCache(key);
    if (cached !== null) return cached;
  } else {
    clearGlobalDataCache(key);
  }

  const activePromise = inFlightStore.get(key);
  if (activePromise) return activePromise;

  const request = (async () => {
    try {
      const fresh = await fetcher();
      writeGlobalDataCache(key, fresh, ttlMs);
      return fresh;
    } finally {
      inFlightStore.delete(key);
    }
  })();

  inFlightStore.set(key, request);
  return request;
};

