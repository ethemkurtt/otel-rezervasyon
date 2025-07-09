import express from "express"
import cors from "cors"
import authRoutes from "./routes/auth.route"
import roomRoutes from "./routes/room.route"
import categoryRoutes from "./routes/category.route"
import reservationRoutes from "./routes/reservation.route"
import analyticsRoutes from "./routes/analytics.route"
import path from "path"

const app = express()

app.use(cors())
app.use(express.json())

// 🟢 Statik dosyalar
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")))

// 🔵 Tüm route'lar
app.use("/api", authRoutes)
app.use("/api/rooms", roomRoutes)
app.use("/api/categories", categoryRoutes)
app.use("/api/reservations", reservationRoutes)
app.use("/api/analytics", analyticsRoutes)

app.get("/", (_, res) => {
  res.send("API çalışıyor!")
})

export default app
