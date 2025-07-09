// src/middlewares/upload.ts
import multer from "multer"
import path from "path"
import fs from "fs"

const storage = multer.diskStorage({
  destination: function (req, _file, cb) {
    const roomId = req.body.roomId || "temp" // ilk aşamada temp diyebiliriz
    const dir = path.join("public", "rooms", roomId)

    // klasörü oluştur
    fs.mkdirSync(dir, { recursive: true })

    cb(null, dir)
  },
  filename: function (_req, file, cb) {
    const ext = path.extname(file.originalname)
    cb(null, `room_${Date.now()}${ext}`)
  }
})

export const upload = multer({ storage })
