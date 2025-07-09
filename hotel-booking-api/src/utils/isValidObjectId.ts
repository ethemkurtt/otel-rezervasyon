import { ObjectId } from "mongodb"

export function isValidObjectId(id: string) {
  return ObjectId.isValid(id) && new ObjectId(id).toHexString() === id
}
