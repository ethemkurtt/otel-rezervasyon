import { Request, Response } from "express";
import * as roomService from "../services/room.service";
import { ObjectId } from "mongodb";
import { getDb } from "../db";
import { getCache, setCache, deletePattern } from "../utils/redis";
import { Room } from "../models/room.model";

// ✅ Oda oluşturma
export async function createRoomHandler(req: Request, res: Response): Promise<void> {
  try {
    const isActive: boolean = req.body.isActive !== "false";
    const roomData: Room = {
      roomNumber: req.body.roomNumber,
      floor: Number(req.body.floor),
      categoryId: req.body.categoryId,
      isActive,
    };

    const roomId = await roomService.createRoom(roomData);
    await deletePattern("rooms:*");
    res.status(201).json({ message: "Oda oluşturuldu", roomId });
  } catch (error) {
    console.error("Oda oluşturma hatası:", error);
    res.status(500).json({ message: "Oda oluşturulamadı" });
  }
}

// ✅ Sayfalı oda listeleme (Redis cache ile)
export async function getPaginatedRoomsHandler(req: Request, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const cacheKey = `rooms:page:${page}:limit:${limit}`;

    const cached = await getCache<{ data: Room[]; total: number }>(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    const { rooms, total } = await roomService.getAllRoomsPaginated(page, limit);
    const response = { data: rooms, total };

    await setCache(cacheKey, response, 300);
    res.json(response);
  } catch (error) {
    console.error("Oda listeleme hatası:", error);
    res.status(500).json({ message: "Odalar getirilemedi" });
  }
}

// ✅ ID ile oda getir
export async function getRoomByIdHandler(req: Request, res: Response): Promise<void> {
  try {
    const room = await roomService.getRoomById(req.params.id);
    if (!room) {
      res.status(404).json({ message: "Oda bulunamadı" });
      return;
    }
    res.json(room);
  } catch (error) {
    console.error("Oda detayı hatası:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  }
}

// ✅ Oda güncelle
export async function updateRoomHandler(req: Request, res: Response): Promise<void> {
  try {
    const success = await roomService.updateRoom(req.params.id, req.body);
    if (!success) {
      res.status(404).json({ message: "Oda bulunamadı" });
      return;
    }

    await deletePattern("rooms:*");
    res.json({ message: "Oda güncellendi" });
  } catch (error) {
    console.error("Oda güncelleme hatası:", error);
    res.status(500).json({ message: "Oda güncellenemedi" });
  }
}

// ✅ Oda sil
export async function deleteRoomHandler(req: Request, res: Response): Promise<void> {
  try {
    const success = await roomService.deleteRoom(req.params.id);
    if (!success) {
      res.status(404).json({ message: "Oda silinemedi" });
      return;
    }

    await deletePattern("rooms:*");
    res.json({ message: "Oda silindi" });
  } catch (error) {
    console.error("Oda silme hatası:", error);
    res.status(500).json({ message: "Oda silinemedi" });
  }
}

// ✅ Oda aktif/pasif güncelle
export async function updateRoomStatusHandler(req: Request, res: Response): Promise<void> {
  try {
    const roomId = req.params.id;
    const isActive = Boolean(req.body.isActive);

    const db = getDb();
    const result = await db
      .collection("rooms")
      .updateOne({ _id: new ObjectId(roomId) }, { $set: { isActive } });

    if (result.modifiedCount === 0) {
      res.status(404).json({ message: "Oda bulunamadı veya güncellenemedi" });
      return;
    }

    await deletePattern("rooms:*");
    res.json({ message: "Durum güncellendi" });
  } catch (error) {
    console.error("Durum güncelleme hatası:", error);
    res.status(500).json({ message: "Durum güncellenemedi" });
  }
}
