import app from "./app"
import { connectToDatabase } from "./db"
import dotenv from "dotenv"
dotenv.config()

const PORT = process.env.PORT || 5000

async function startServer() {
  await connectToDatabase()

  app.listen(PORT, () => {
    console.log(`🚀 Sunucu çalışıyor: http://localhost:${PORT}`)
  })
}

startServer()
