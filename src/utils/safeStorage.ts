/**
 * Safe localStorage utilities that handle quota exceeded errors
 * and provide fallback mechanisms for Safari and other browsers
 */

export interface StorageInfo {
  total: number;
  used: number;
  available: number;
  percentUsed: number;
}

export interface SafeStorageResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  fallbackUsed?: boolean;
}

/**
 * Calculate current localStorage usage
 */
export const calculateStorageSpace = (): StorageInfo => {
  let total = 0;
  let used = 0;

  try {
    // Typical LocalStorage quota is ~5-10 MB, Safari is more restrictive
    // Use conservative estimate for Safari
    total = 5 * 1024 * 1024; // 5MB

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      const value = localStorage.getItem(key);
      if (value) {
        // Each UTF-16 char = 2 bytes
        used += value.length * 2;
      }
    }
  } catch (err) {
    console.error("[SafeStorage] Error calculating storage space", err);
  }

  return {
    total,
    used,
    available: total - used,
    percentUsed: Math.round((used / total) * 100),
  };
};

/**
 * Check if localStorage is available and working
 */
export const isLocalStorageAvailable = (): boolean => {
  try {
    const testKey = '__test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Safely get item from localStorage with error handling
 */
export const safeGetItem = (key: string): SafeStorageResult<string> => {
  try {
    const value = localStorage.getItem(key);
    return {
      success: true,
      data: value,
    };
  } catch (error) {
    console.error(`[SafeStorage] Error getting item ${key}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Safely set item in localStorage with quota exceeded handling
 */
export const safeSetItem = (key: string, value: string): SafeStorageResult<void> => {
  try {
    // Check if we're approaching the limit
    const storageInfo = calculateStorageSpace();
    const newItemSize = value.length * 2; // UTF-16 bytes
    
    if (storageInfo.available < newItemSize + 1024) { // 1KB buffer
      console.warn(`[SafeStorage] Storage space low (${storageInfo.percentUsed}% used). Attempting to clean up...`);
      
      // Try to clean up old data
      const cleaned = cleanupOldData(key, newItemSize);
      if (!cleaned) {
        return {
          success: false,
          error: 'Storage quota exceeded and cleanup failed',
        };
      }
    }

    localStorage.setItem(key, value);
    return {
      success: true,
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      console.warn(`[SafeStorage] Quota exceeded for key ${key}. Attempting cleanup...`);
      
      // Try to clean up and retry
      const cleaned = cleanupOldData(key, value.length * 2);
      if (cleaned) {
        try {
          localStorage.setItem(key, value);
          return {
            success: true,
            fallbackUsed: true,
          };
        } catch (retryError) {
          console.error(`[SafeStorage] Failed to set item after cleanup:`, retryError);
        }
      }
      
      return {
        success: false,
        error: 'Storage quota exceeded',
      };
    }
    
    console.error(`[SafeStorage] Error setting item ${key}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Clean up old data to make space for new data
 */
const cleanupOldData = (excludeKey: string, requiredSpace: number): boolean => {
  try {
    const storageInfo = calculateStorageSpace();
    if (storageInfo.available >= requiredSpace) {
      return true; // No cleanup needed
    }

    // Get all keys and their sizes, sorted by last accessed time (if available)
    const items: Array<{ key: string; size: number; lastAccessed?: number }> = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || key === excludeKey) continue;
      
      const value = localStorage.getItem(key);
      if (value) {
        const size = value.length * 2;
        items.push({ key, size });
      }
    }

    // Sort by size (largest first) to free up space efficiently
    items.sort((a, b) => b.size - a.size);

    let freedSpace = 0;
    const targetSpace = requiredSpace + 1024; // 1KB buffer

    for (const item of items) {
      if (freedSpace >= targetSpace) break;
      
      // Don't delete critical system keys
      if (item.key.startsWith('ryos:') && !item.key.includes('soundboard')) {
        continue;
      }
      
      try {
        localStorage.removeItem(item.key);
        freedSpace += item.size;
        console.log(`[SafeStorage] Cleaned up ${item.key} (${item.size} bytes)`);
      } catch (err) {
        console.error(`[SafeStorage] Failed to remove ${item.key}:`, err);
      }
    }

    return freedSpace >= requiredSpace;
  } catch (error) {
    console.error('[SafeStorage] Error during cleanup:', error);
    return false;
  }
};

/**
 * Create a safe storage wrapper for Zustand persist
 */
export const createSafeJSONStorage = () => {
  // Check if localStorage is available
  if (!isLocalStorageAvailable()) {
    console.warn('[SafeStorage] localStorage is not available, using memory-only storage');
    const memoryStorage = new Map<string, string>();
    
    return {
      getItem: (name: string) => {
        return Promise.resolve(memoryStorage.get(name) || null);
      },
      setItem: (name: string, value: string) => {
        memoryStorage.set(name, value);
        return Promise.resolve();
      },
      removeItem: (name: string) => {
        memoryStorage.delete(name);
        return Promise.resolve();
      },
    };
  }

  return {
    getItem: (name: string) => {
      const result = safeGetItem(name);
      return Promise.resolve(result.success ? result.data : null);
    },
    setItem: (name: string, value: string) => {
      const result = safeSetItem(name, value);
      if (!result.success) {
        console.error(`[SafeStorage] Failed to persist ${name}:`, result.error);
        // Don't throw - let the app continue without persistence
      }
      return Promise.resolve();
    },
    removeItem: (name: string) => {
      try {
        localStorage.removeItem(name);
        return Promise.resolve();
      } catch (error) {
        console.error(`[SafeStorage] Error removing item ${name}:`, error);
        return Promise.resolve(); // Don't throw
      }
    },
  };
};

/**
 * Get storage warning level
 */
export const getStorageWarningLevel = (): 'safe' | 'warning' | 'critical' => {
  const storageInfo = calculateStorageSpace();
  
  if (storageInfo.percentUsed >= 90) {
    return 'critical';
  } else if (storageInfo.percentUsed >= 75) {
    return 'warning';
  }
  
  return 'safe';
};