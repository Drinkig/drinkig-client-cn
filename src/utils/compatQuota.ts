import AsyncStorage from '@react-native-async-storage/async-storage';

export const FREE_DAILY_COMPAT_LIMIT = 3;
const STORAGE_KEY = 'compatQuota:v1';

interface QuotaData {
  date: string; // YYYY-MM-DD
  unlocked: number[]; // wineIds unlocked today
}

const getTodayKey = (): string => new Date().toISOString().slice(0, 10);

export async function loadCompatQuota(): Promise<QuotaData> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return { date: getTodayKey(), unlocked: [] };
    const parsed = JSON.parse(raw) as QuotaData;
    if (parsed.date !== getTodayKey()) {
      return { date: getTodayKey(), unlocked: [] };
    }
    return parsed;
  } catch {
    return { date: getTodayKey(), unlocked: [] };
  }
}

export async function isWineCompatUnlocked(wineId: number | string): Promise<boolean> {
  const q = await loadCompatQuota();
  return q.unlocked.includes(Number(wineId));
}

export async function getCompatRemaining(): Promise<number> {
  const q = await loadCompatQuota();
  return Math.max(0, FREE_DAILY_COMPAT_LIMIT - q.unlocked.length);
}

/**
 * Unlock a wine's compatibility for today.
 * Returns true on success (or if already unlocked), false if the daily quota is exhausted.
 */
export async function unlockWineCompat(wineId: number | string): Promise<boolean> {
  const id = Number(wineId);
  const q = await loadCompatQuota();
  if (q.unlocked.includes(id)) return true;
  if (q.unlocked.length >= FREE_DAILY_COMPAT_LIMIT) return false;
  const next: QuotaData = { date: q.date, unlocked: [...q.unlocked, id] };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return true;
}
