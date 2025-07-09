import { getDb } from "../db";
import { Room } from "../models/room.model";
import { ObjectId } from "mongodb";

const COLLECTION_NAME = "rooms";

// ✅ Oda oluştur
export async function createRoom(roomData: Room): Promise<string> {
  const db = getDb();
  const result = await db.collection(COLLECTION_NAME).insertOne({
    roomNumber: roomData.roomNumber,
    floor: roomData.floor,
    categoryId: new ObjectId(roomData.categoryId),
    isActive: roomData.isActive ?? true,
    createdAt: new Date(),
  });
  return result.insertedId.toString();
}

// ✅ Tüm odaları getir (küçük veri setleri için)
export async function getAllRooms(): Promise<Room[]> {
  const db = getDb();
  const docs = await db
    .collection(COLLECTION_NAME)
    .aggregate([
      {
        $lookup: {
          from: "categories",
          localField: "categoryId",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: "$category" },
    ])
    .toArray();

  return docs as Room[];
}

// ✅ Tek oda getir
export async function getRoomById(id: string): Promise<Room | null> {
  if (!ObjectId.isValid(id)) return null;
  const db = getDb();

  const docs = await db
    .collection(COLLECTION_NAME)
    .aggregate([
      { $match: { _id: new ObjectId(id) } },
      {
        $lookup: {
          from: "categories",
          localField: "categoryId",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: "$category" },
    ])
    .toArray();

  return (docs[0] as Room) || null;
}

// ✅ Oda güncelle
export async function updateRoom(
  id: string,
  updateData: Partial<Room>
): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;

  const db = getDb();
  const update: Partial<Room> & { categoryId?: ObjectId } = {};

  if (updateData.roomNumber) update.roomNumber = updateData.roomNumber;
  if (updateData.floor !== undefined) update.floor = updateData.floor;
  if (updateData.categoryId && ObjectId.isValid(updateData.categoryId)) {
    update.categoryId = new ObjectId(updateData.categoryId);
  }
  if (updateData.isActive !== undefined) update.isActive = updateData.isActive;

  const result = await db
    .collection(COLLECTION_NAME)
    .updateOne({ _id: new ObjectId(id) }, { $set: update });

  return result.modifiedCount > 0;
}

// ✅ Oda sil
export async function deleteRoom(id: string): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;

  const db = getDb();
  const result = await db.collection(COLLECTION_NAME).deleteOne({
    _id: new ObjectId(id),
  });
  return result.deletedCount > 0;
}

// ✅ Pagination destekli odaları getir
export async function getAllRoomsPaginated(
  page: number,
  limit: number,
  search?: string
): Promise<{ rooms: Room[]; total: number }> {
  const db = getDb();
  const skip = (page - 1) * limit;

  const filter: any = {};
  if (search) {
    filter.roomNumber = { $regex: search, $options: "i" };
  }

  const [rooms, total] = await Promise.all([
    db
      .collection(COLLECTION_NAME)
      .aggregate([
        { $match: filter },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $lookup: {
            from: "categories",
            localField: "categoryId",
            foreignField: "_id",
            as: "category",
          },
        },
        { $unwind: "$category" },
        {
          $project: {
            roomNumber: 1,
            floor: 1,
            isActive: 1,
            categoryId: 1,
            category: {
              name: "$category.name",
              price: "$category.price",
              capacity: "$category.capacity",
            },
          },
        },
      ])
      .toArray()
      .then((docs) => docs as Room[]),

    db.collection(COLLECTION_NAME).countDocuments(filter),
  ]);

  return { rooms, total };
}
