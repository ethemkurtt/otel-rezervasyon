import { ObjectId } from "mongodb"

export interface Category {
  _id?: ObjectId
  name: string
  image: string
  price: number
  capacity: number
  isActive?: boolean // opsiyonel ama ölçeklenebilirlik için mantıklı
  createdAt?: Date
  updatedAt?: Date
}