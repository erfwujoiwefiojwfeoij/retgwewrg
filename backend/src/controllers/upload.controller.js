const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { uploadDir } = require('../config/env');
const { AppError } = require('../utils/errors');

fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      cb(new AppError(400, 'Допустимы JPG, PNG или WebP'));
      return;
    }
    cb(null, true);
  },
});

function sendFile(req, res) {
  if (!req.file) throw new AppError(400, 'Файл не получен');
  res.status(201).json({ data: { url: `/uploads/${req.file.filename}` } });
}

module.exports = { upload, sendFile };
