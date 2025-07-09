import { Router } from "express"
import {
  createRoomHandler,
  getPaginatedRoomsHandler,
  getRoomByIdHandler,
  updateRoomHandler,
  deleteRoomHandler,
  updateRoomStatusHandler
} from "../controllers/room.controller"

const router = Router()

// ✅ Odalar (pagination ile)
router.get("/", getPaginatedRoomsHandler) // ?page=1&limit=20
router.post("/", createRoomHandler)
router.get("/:id", getRoomByIdHandler)
router.put("/:id", updateRoomHandler)
router.delete("/:id", deleteRoomHandler)
router.patch("/:id/status", updateRoomStatusHandler)

export default router
