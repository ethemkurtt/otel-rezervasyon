import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import { getDb } from "../db";
import * as reservationService from "../services/reservation.service";
import { JwtPayload } from "../types/jwt-payload";
import { deleteAvailabilityCache } from "../utils/redis";
import { Reservation } from "../models/reservation.model";
import { getAllReservationsPaginated } from "../services/reservation.service";

function getUserIdFromToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    return decoded.id;
  } catch {
    return null;
  }
}

export async function createReservationHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({ message: "Kimlik doğrulanamadı" });
      return;
    }

    const reservationData: Reservation = {
      ...req.body,
      userId: new ObjectId(userId),
      roomId: new ObjectId(req.body.roomId),
      startDate: new Date(req.body.startDate),
      endDate: new Date(req.body.endDate),
      guestCount: Number(req.body.guestCount),
    };

    const id = await reservationService.createReservation(reservationData);
    if (!id) {
      res
        .status(409)
        .json({ message: "Bu tarih aralığında rezervasyon yapılamaz." });
      return;
    }

    await deleteAvailabilityCache(
      reservationData.startDate,
      reservationData.endDate
    );

    res.status(201).json({ message: "Rezervasyon oluşturuldu", id });
  } catch (error) {
    res.status(500).json({ message: "Sunucu hatası" });
  }
}

export async function getUserReservationsHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const userId = (req as any).user?.id;
    const db = getDb();

    const reservations = await db
      .collection("reservations")
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
            _id: 1,
            startDate: 1,
            endDate: 1,
            guestCount: 1,
            createdAt: 1,
            roomNumber: "$room.roomNumber",
            floor: "$room.floor",
            categoryName: "$category.name",
            categoryImage: "$category.image",
            price: "$category.price",
          },
        },
      ])
      .toArray();

    res.json(reservations);
  } catch (error) {
    res.status(500).json({ message: "Veriler alınamadı" });
  }
}

export async function getPaginatedReservationsHandler(
  req: Request,
  res: Response
) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const { reservations, total } = await getAllReservationsPaginated(
      page,
      limit
    );

    res.json({ reservations, total });
  } catch (error) {
    console.error("Rezervasyon listeleme hatası:", error);
    res.status(500).json({ message: "Rezervasyonlar getirilemedi" });
  }
}

export async function updateReservationHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const userId = getUserIdFromToken(req);
    if (!userId) {
      res.status(401).json({ message: "Yetkisiz" });
      return;
    }

    const success = await reservationService.updateReservation(
      req.params.id,
      req.body
    );
    if (!success) {
      res.status(409).json({ message: "Güncelleme mümkün değil." });
      return;
    }

    res.json({ message: "Rezervasyon güncellendi" });
  } catch {
    res.status(500).json({ message: "Sunucu hatası" });
  }
}

export async function deleteReservationHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const userId = getUserIdFromToken(req);
    if (!userId) {
      res.status(401).json({ message: "Yetkisiz" });
      return;
    }

    const success = await reservationService.deleteReservation(
      req.params.id
    );
    if (!success) {
      res.status(404).json({ message: "Rezervasyon bulunamadı" });
      return;
    }

    res.json({ message: "Silindi" });
  } catch {
    res.status(500).json({ message: "Silinemedi" });
  }
}

export async function getAvailableRoomsHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { start, end } = req.query;
    if (!start || !end) {
      res.status(400).json({ message: "Tarih gerekli" });
      return;
    }

    const rooms = await reservationService.getAvailableRooms(
      new Date(start as string),
      new Date(end as string)
    );
    res.json(rooms);
  } catch {
    res.status(500).json({ message: "Müsait odalar getirilemedi" });
  }
}

export async function updateReservationDatesHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const userId = (req as any).user?.id;
    const { startDate, endDate } = req.body;
    const reservationId = req.params.id;

    if (!userId) {
      res.status(401).json({ message: "Yetkisiz" });
      return;
    }

    const success = await reservationService.updateReservationDates(
      reservationId,
      userId,
      new Date(startDate),
      new Date(endDate)
    );

    if (!success) {
      res.status(409).json({
        message:
          "Seçilen tarih aralığı uygun değil veya güncelleme yapılamadı.",
      });
      return;
    }

    res.json({ message: "Rezervasyon güncellendi" });
  } catch {
    res.status(500).json({ message: "Sunucu hatası" });
  }
}
