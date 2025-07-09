import { Request, Response } from "express"
import { getDb } from "../db"
import bcrypt from "bcrypt"
import { generateToken } from "../utils/jwt"
import { User } from "../models/user.model"
import { WithId } from "mongodb"

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const db = getDb()
    const { fullName, email, password, phone, birthDate, role } = req.body

    const existing = await db.collection<User>("users").findOne({ email })
    if (existing) {
      res.status(409).json({ message: "Bu e-posta zaten kayıtlı" })
      return
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const newUser: User = {
      fullName,
      email,
      phone,
      birthDate,
      password: hashedPassword,
      role: role === "admin" ? "admin" : "customer",
      createdAt: new Date(),
    }

    await db.collection<User>("users").insertOne(newUser)

    res.status(201).json({ message: "Kayıt başarılı" })
  } catch (error) {
    console.error("Kayıt hatası:", error)
    res.status(500).json({ message: "Sunucu hatası" })
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const db = getDb()
    const { email, password } = req.body

    const user = await db.collection<User>("users").findOne({ email }) as WithId<User> | null
    if (!user) {
      res.status(404).json({ message: "E-posta bulunamadı" })
      return
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      res.status(401).json({ message: "Şifre hatalı" })
      return
    }

    const token = generateToken({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    })

    const { password: _, ...safeUser } = user

    res.json({ token, user: safeUser })
  } catch (error) {
    console.error("Giriş hatası:", error)
    res.status(500).json({ message: "Sunucu hatası" })
  }
}
