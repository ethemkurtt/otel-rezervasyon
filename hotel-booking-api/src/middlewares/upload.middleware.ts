import multer from "multer"
import path from "path"
import fs from "fs"

// Dinamik hedef klasörü oluşturmak için
const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const roomId = req.params.roomId
    const dir = path.join(__dirname, "../../public/rooms", roomId)

    // klasör yoksa oluştur
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    cb(null, dir)
  },
  filename: (_req, file, cb) => {
    // Örn: oda_id_1.jpg gibi
    const ext = path.extname(file.originalname)
    const name = Date.now() + ext
    cb(null, name)
  }
})

export const upload = multer({ storage })
