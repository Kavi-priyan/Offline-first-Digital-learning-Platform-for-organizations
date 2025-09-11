import { Router } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Use backend/uploads (same as server static path)
const uploadsDir = path.resolve(__dirname, '../../uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (_req, file, cb) {
    const safe = file.originalname.replace(/[^a-zA-Z0-9_.-]/g, '_');
    const stamp = Date.now();
    cb(null, `${stamp}_${safe}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 1024 * 1024 * 1024 }
});

router.post('/video', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'no_file' });
    const publicUrl = `/uploads/${req.file.filename}`;
    res.status(201).json({ url: publicUrl });
  } catch (e) {
    res.status(500).json({ error: 'upload_failed', message: e?.message });
  }
});

export default router;


