import { Router } from "express"
import {
  getMonthlyAnalyticsHandler,
  getCategoryAnalyticsHandler,
} from "../controllers/analytics.controller"

const router = Router()

router.get("/monthly-summary", getMonthlyAnalyticsHandler)
router.get("/category-summary", getCategoryAnalyticsHandler)

export default router
