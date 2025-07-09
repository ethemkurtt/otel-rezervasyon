import { MongoClient, Db } from "mongodb"
import dotenv from "dotenv"
dotenv.config()

const client = new MongoClient(process.env.MONGODB_URI!)
let db: Db

export async function connectToDatabase() {
  try {
    await client.connect()
    db = client.db()
    console.log("✅ MongoDB bağlantısı başarılı")
  } catch (err) {
    console.error("❌ MongoDB bağlantı hatası:", err)
    process.exit(1)
  }
}

export function getDb(): Db {
  if (!db) throw new Error("📛 Veritabanı henüz bağlanmadı.")
  return db
}
