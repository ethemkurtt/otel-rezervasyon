import { Request, Response } from "express"
import {
  getMonthlyReservationSummary,
  getReservationByCategorySummary,
} from "../services/analytics.service"


export async function getMonthlyAnalyticsHandler(req: Request, res: Response): Promise<void> {
  try {
    const data = await getMonthlyReservationSummary()
    res.status(200).json({
      success: true,
      message: "Aylık rezervasyon verileri getirildi",
      data,
    })
  } catch (error) {
    console.error(" Aylık analiz hatası:", error)
    res.status(500).json({
      success: false,
      message: "Aylık analiz verileri alınamadı",
    })
  }
}


export async function getCategoryAnalyticsHandler(req: Request, res: Response): Promise<void> {
  try {
    const data = await getReservationByCategorySummary()
    res.status(200).json({
      success: true,
      message: "Kategori bazlı analiz getirildi",
      data,
    })
  } catch (error) {
    console.error(" Kategori analiz hatası:", error)
    res.status(500).json({
      success: false,
      message: "Kategori analizi verileri alınamadı",
    })
  }
}
