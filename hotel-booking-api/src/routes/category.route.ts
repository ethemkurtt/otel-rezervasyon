import { Router } from "express"
import multer from "multer"
import path from "path"
import {
  createCategoryHandler,
  getAllCategoriesHandler,
  getCategoryByIdHandler,
  updateCategoryHandler,
  deleteCategoryHandler
} from "../controllers/category.controller"

const router = Router()

// 📁 Görsel yükleme için multer ayarı
const storage = multer.diskStorage({
  destination: "uploads/categories",
  filename: (_req, file, cb) => {
    cb(null, `${Date.now()}${path.extname(file.originalname)}`)
  }
})
const upload = multer({ storage })

router.put("/:id", upload.single("image"), updateCategoryHandler)
router.post("/", upload.single("image"), createCategoryHandler)
router.get("/", getAllCategoriesHandler)
router.get("/:id", getCategoryByIdHandler)
router.delete("/:id", deleteCategoryHandler)

export default router
