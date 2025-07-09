import { getDb } from "../db"
import { ObjectId } from "mongodb"
import { Category } from "../models/category.model"

// ID kontrolü (24 karakterlik hex mi?)
function isValidMongoId(id: string): boolean {
  return /^[a-f\d]{24}$/i.test(id)
}

// ✅ Kategori oluştur
export async function createCategory(data: Category): Promise<string> {
  const db = getDb()
  const result = await db.collection("categories").insertOne(data)
  return result.insertedId.toString()
}

// ✅ Tüm kategorileri getir
export async function getAllCategories(): Promise<Category[]> {
  const db = getDb()
  return db.collection<Category>("categories").find().toArray()
}

// ✅ Tek kategori getir (ID ile)
export async function getCategoryById(id: string): Promise<Category | null> {
  const db = getDb()

  if (!isValidMongoId(id)) return null

  return db.collection<Category>("categories").findOne({ _id: new ObjectId(id) })
}

// ✅ Kategori güncelle
export async function updateCategory(id: string, update: Partial<Category>): Promise<boolean> {
  const db = getDb()

  if (!isValidMongoId(id)) return false

  const result = await db.collection("categories").updateOne(
    { _id: new ObjectId(id) },
    { $set: update }
  )

  return result.modifiedCount > 0
}

// ✅ Kategori sil
export async function deleteCategory(id: string): Promise<boolean> {
  const db = getDb()

  if (!isValidMongoId(id)) return false

  const result = await db.collection("categories").deleteOne({ _id: new ObjectId(id) })
  return result.deletedCount > 0
}
