import { ObjectId } from "mongodb"

export interface Room {
  _id?: ObjectId
  roomNumber: string
  floor: number
  categoryId: ObjectId
  isActive: boolean
  createdAt?: Date
  updatedAt?: Date
}