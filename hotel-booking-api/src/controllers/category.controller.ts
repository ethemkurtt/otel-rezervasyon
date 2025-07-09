import { Request, Response } from "express"
import { ObjectId } from "mongodb"
import * as categoryService from "../services/category.service"
import { getDb } from "../db"
import { isValidObjectId } from "../utils/isValidObjectId"
import fs from "fs/promises"
import path from "path"
import { Category } from "../models/category.model"


export async function createCategoryHandler(req: Request, res: Response): Promise<void> {
  try {
    const db = getDb()
    const { name, price, capacity } = req.body

    const existing = await db.collection<Category>("categories").findOne({
      name: { $regex: `^${name}$`, $options: "i" },
    })
    if (existing) {
      res.status(400).json({ message: "Bu isimde bir kategori zaten var." })
      return
    }

    const image = req.file?.filename || ""
    const imagePath = `uploads/categories/${image}`

    const id = await categoryService.createCategory({
      name,
      price: Number(price),
      capacity: Number(capacity),
      image: imagePath,
    })

    res.status(201).json({ message: "Kategori oluşturuldu", id })
  } catch (error) {
    console.error("Kategori oluşturma hatası:", error)
    res.status(500).json({ message: "Kategori oluşturulamadı" })
  }
}


export async function getAllCategoriesHandler(_req: Request, res: Response): Promise<void> {
  try {
    const categories = await categoryService.getAllCategories()
    res.json(categories)
  } catch (error) {
    console.error("Kategori listeleme hatası:", error)
    res.status(500).json({ message: "Kategoriler getirilemedi" })
  }
}


export async function getCategoryByIdHandler(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id
    if (!isValidObjectId(id)) {
      res.status(400).json({ message: "Geçersiz kategori ID" })
      return
    }

    const category = await categoryService.getCategoryById(id)
    if (!category) {
      res.status(404).json({ message: "Kategori bulunamadı" })
      return
    }

    res.json(category)
  } catch (error) {
    console.error("Kategori getirme hatası:", error)
    res.status(500).json({ message: "Kategori getirilemedi" })
  }
}


export async function updateCategoryHandler(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id
    const { name, price, capacity } = req.body

    const existing = await categoryService.getCategoryById(id)
    if (!existing) {
      res.status(404).json({ message: "Kategori bulunamadı" })
      return
    }

    let imagePath = existing.image
    if (req.file) {
      const newPath = `uploads/categories/${path.basename(existing.image)}`
      await fs.rename(req.file.path, newPath)
      imagePath = newPath
    }

    const success = await categoryService.updateCategory(id, {
      name,
      price: Number(price),
      capacity: Number(capacity),
      image: imagePath,
    })

    if (!success) {
      res.status(400).json({ message: "Kategori güncellenemedi" })
      return
    }

    res.json({ message: "Kategori güncellendi" })
  } catch (error) {
    console.error("Kategori güncelleme hatası:", error)
    res.status(500).json({ message: "Kategori güncellenemedi" })
  }
}


export async function deleteCategoryHandler(req: Request, res: Response): Promise<void> {
  try {
    const success = await categoryService.deleteCategory(req.params.id)
    if (!success) {
      res.status(404).json({ message: "Kategori silinemedi" })
      return
    }

    res.json({ message: "Kategori silindi" })
  } catch (error) {
    console.error("Kategori silme hatası:", error)
    res.status(500).json({ message: "Kategori silinemedi" })
  }
}
