import { Router } from "express";
import {
  createReservationHandler,
  getPaginatedReservationsHandler,
  getUserReservationsHandler,
  updateReservationHandler,
  deleteReservationHandler,
  getAvailableRoomsHandler,
  updateReservationDatesHandler,
} from "../controllers/reservation.controller";
import { verifyToken } from "../middlewares/auth.middleware";

const router = Router();

router.get("/available", getAvailableRoomsHandler);
router.get("/me", verifyToken, getUserReservationsHandler);
router.get("/", verifyToken, getPaginatedReservationsHandler);
router.post("/", verifyToken, createReservationHandler);
router.put("/:id", verifyToken, updateReservationHandler);
router.put("/:id/dates", verifyToken, updateReservationDatesHandler);
router.delete("/:id", verifyToken, deleteReservationHandler);
export default router;
