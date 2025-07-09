import { createClient } from "redis";

const redis = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

redis.on("error", (err) => console.error("Redis bağlantı hatası:", err));
redis.connect();

export default redis;

// 🧹 availability:* pattern cache sil
export async function deleteAvailabilityCache(startDate: Date, endDate: Date) {
  const key = `availability:${startDate.toISOString()}_${endDate.toISOString()}`;
  await redis.del(key);
}

// 🧹 Genel pattern silici
export async function deletePattern(pattern: string) {
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del.apply(redis, keys as string[]);
  }
}

// 📦 Cache’ten veri alma
export async function getCache<T>(key: string): Promise<T | null> {
  const data = await redis.get(key);
  return data ? JSON.parse(data.toString()) : null;
}

// 📦 Cache'e veri yazma
export async function setCache(
  key: string,
  value: any,
  ttlSeconds = 300
): Promise<void> {
  await redis.set(key, JSON.stringify(value), {
    EX: ttlSeconds,
  });
}
