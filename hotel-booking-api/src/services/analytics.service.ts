import { getDb } from "../db"

export async function getMonthlyReservationSummary() {
  const db = getDb()
  return db.collection("reservations").aggregate([
    {
      $group: {
        _id: { $month: { $toDate: "$startDate" } },
        total: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        month: "$_id",
        total: 1,
      },
    },
    { $sort: { month: 1 } },
  ]).toArray()
}

export async function getReservationByCategorySummary() {
  const db = getDb()
  return db.collection("reservations").aggregate([
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
      $group: {
        _id: "$category.name",
        total: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        category: "$_id",
        total: 1,
      },
    },
    { $sort: { total: -1 } },
  ]).toArray()
}
