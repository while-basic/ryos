export const safeStorage = () => {
  let inMemoryStore: Record<string, string | null> = {};

  // Check for window and localStorage availability and basic functionality
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const testKey = "__storage_test__";
      window.localStorage.setItem(testKey, testKey);
      window.localStorage.removeItem(testKey);

      // If no error thrown, wrap the native localStorage in the required interface
      return {
        getItem: (key: string) => window.localStorage.getItem(key),
        setItem: (key: string, value: string) => window.localStorage.setItem(key, value),
        removeItem: (key: string) => window.localStorage.removeItem(key),
      } as const;
    }
  } catch (error) {
    // Intentionally fall through to in-memory fallback on error
    console.warn("localStorage is unavailable, falling back to in-memory storage", error);
  }

  // In-memory fallback implementation – will not persist across page reloads
  return {
    getItem: (key: string) => inMemoryStore[key] ?? null,
    setItem: (key: string, value: string) => {
      inMemoryStore[key] = value;
    },
    removeItem: (key: string) => {
      delete inMemoryStore[key];
    },
  } as const;
};