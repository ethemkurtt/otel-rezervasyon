import { getDb } from "../db";
import { ObjectId } from "mongodb";
import { Reservation } from "../models/reservation.model";

const COLLECTION = "reservations";

/** 🔹 1. REZERVASYON OLUŞTURMA */
export async function createReservation(
  data: Reservation
): Promise<string | null> {
  const db = getDb();

  const conflict = await db.collection(COLLECTION).findOne({
    roomId: new ObjectId(data.roomId),
    $and: [
      { startDate: { $lt: new Date(data.endDate) } },
      { endDate: { $gt: new Date(data.startDate) } },
    ],
  });

  if (conflict) return null;

  const result = await db.collection(COLLECTION).insertOne({
    ...data,
    roomId: new ObjectId(data.roomId),
    userId: new ObjectId(data.userId),
    startDate: new Date(data.startDate),
    endDate: new Date(data.endDate),
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return result.insertedId.toString();
}

/** 🔹 2. TÜM REZERVASYONLARI AL (sayfalı) */
export async function getAllReservationsPaginated(page: number, limit: number) {
  const db = getDb();
  const skip = (page - 1) * limit;

  const [reservations, total] = await Promise.all([
    db
      .collection(COLLECTION)
      .aggregate([
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $lookup: {
            from: "rooms",
            localField: "roomId",
            foreignField: "_id",
            as: "room",
          },
        },
        { $unwind: { path: "$room", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "categories",
            localField: "room.categoryId",
            foreignField: "_id",
            as: "category",
          },
        },
        { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            startDate: 1,
            endDate: 1,
            guestCount: 1,
            createdAt: 1,
            room: {
              roomNumber: "$room.roomNumber",
              floor: "$room.floor",
              category: {
                name: "$category.name",
                price: "$category.price",
                capacity: "$category.capacity",
                image: "$category.image",
              },
            },
          },
        },
      ])
      .toArray(),
    db.collection(COLLECTION).countDocuments(),
  ]);

  return { reservations, total };
}

/** 🔹 3. KULLANICININ KENDİ REZERVASYONLARI */
export async function getUserReservations(userId: string) {
  const db = getDb();

  return await db
    .collection(COLLECTION)
    .aggregate([
      { $match: { userId: new ObjectId(userId) } },
      {
        $lookup: {
          from: "rooms",
          localField: "roomId",
          foreignField: "_id",
          as: "room",
        },
      },
      { $unwind: "$room" },
      {
        $lookup: {
          from: "categories",
          localField: "room.categoryId",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: "$category" },
      {
        $project: {
          startDate: 1,
          endDate: 1,
          guestCount: 1,
          createdAt: 1,
          updatedAt: 1,
          room: {
            roomNumber: "$room.roomNumber",
            floor: "$room.floor",
          },
          category: {
            name: "$category.name",
            price: "$category.price",
            capacity: "$category.capacity",
            image: "$category.image",
          },
        },
      },
    ])
    .toArray();
}

/** 🔹 4. MÜSAİT ODALARI BUL (Index + Redis için uygun yapı) */
export async function getAvailableRooms(start: Date, end: Date) {
  const db = getDb();

  const reservedRoomIds = await db.collection(COLLECTION).distinct("roomId", {
    $and: [{ startDate: { $lt: end } }, { endDate: { $gt: start } }],
  });

  return await db
    .collection("rooms")
    .aggregate([
      {
        $match: {
          _id: { $nin: reservedRoomIds.map((id) => new ObjectId(id)) },
          isActive: true,
        },
      },
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
}

/** 🔹 5. REZERVASYON GÜNCELLE */
export async function updateReservation(
  id: string,
  updateData: Partial<Reservation>
): Promise<boolean> {
  const db = getDb();

  const existing = await db
    .collection(COLLECTION)
    .findOne({ _id: new ObjectId(id) });
  if (!existing) return false;

  const roomId = updateData.roomId
    ? new ObjectId(updateData.roomId)
    : existing.roomId;
  const startDate = updateData.startDate
    ? new Date(updateData.startDate)
    : existing.startDate;
  const endDate = updateData.endDate
    ? new Date(updateData.endDate)
    : existing.endDate;

  const conflict = await db.collection(COLLECTION).findOne({
    _id: { $ne: new ObjectId(id) },
    roomId,
    $and: [{ startDate: { $lt: endDate } }, { endDate: { $gt: startDate } }],
  });

  if (conflict) return false;

  const result = await db.collection(COLLECTION).updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        ...updateData,
        roomId,
        startDate,
        endDate,
        updatedAt: new Date(),
      },
    }
  );

  return result.modifiedCount > 0;
}

/** 🔹 6. REZERVASYON SİL */
export async function deleteReservation(id: string): Promise<boolean> {
  const db = getDb();
  const result = await db
    .collection(COLLECTION)
    .deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount > 0;
}

/** 🔹 7. TARİH GÜNCELLE */
export async function updateReservationDates(
  reservationId: string,
  userId: string,
  newStartDate: Date,
  newEndDate: Date
): Promise<boolean> {
  const db = getDb();

  const existing = await db.collection(COLLECTION).findOne({
    _id: new ObjectId(reservationId),
    userId: new ObjectId(userId),
  });
  if (!existing) return false;

  const conflict = await db.collection(COLLECTION).findOne({
    _id: { $ne: new ObjectId(reservationId) },
    roomId: existing.roomId,
    $or: [
      {
        startDate: { $lte: newEndDate },
        endDate: { $gte: newStartDate },
      },
    ],
  });

  if (conflict) return false;

  const result = await db.collection(COLLECTION).updateOne(
    { _id: new ObjectId(reservationId) },
    {
      $set: {
        startDate: newStartDate,
        endDate: newEndDate,
        updatedAt: new Date(),
      },
    }
  );

  return result.modifiedCount > 0;
}
// export async function getAllReservationsPaginated(page: number, limit: number) {
//   const db = getDb();
//   const skip = (page - 1) * limit;

//   const [reservations, total] = await Promise.all([
//     db
//       .collection("reservations")
//       .aggregate([
//         { $sort: { createdAt: -1 } },
//         { $skip: skip },
//         { $limit: limit },
//         {
//           $lookup: {
//             from: "rooms",
//             localField: "roomId",
//             foreignField: "_id",
//             as: "room",
//           },
//         },
//         { $unwind: "$room" },
//         {
//           $lookup: {
//             from: "categories",
//             localField: "room.categoryId",
//             foreignField: "_id",
//             as: "category",
//           },
//         },
//         { $unwind: "$category" },
//         {
//           $project: {
//             _id: 1,
//             startDate: 1,
//             endDate: 1,
//             guestCount: 1,
//             createdAt: 1,
//             userId: 1,
//             room: {
//               roomNumber: "$room.roomNumber",
//               floor: "$room.floor",
//               category: {
//                 name: "$category.name",
//                 price: "$category.price",
//                 image: "$category.image",
//                 capacity: "$category.capacity",
//               },
//             },
//           },
//         },
//       ])
//       .toArray(),

//     db.collection("reservations").countDocuments(),
//   ]);

//   return { reservations, total };
// }
