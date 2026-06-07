const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = uuidv4() + ext;
    cb(null, name);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }
});

function getFileType(filename) {
  const ext = path.extname(filename).toLowerCase();
  if (['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.tiff'].includes(ext)) return 'image';
  if (['.mp4', '.webm', '.mov', '.avi', '.mkv'].includes(ext)) return 'video';
  if (['.pdf'].includes(ext)) return 'pdf';
  return 'other';
}

router.post('/', upload.array('files', 100), (req, res) => {
  const { semester } = req.body;
  if (!semester) {
    return res.status(400).json({ error: 'Semester is required' });
  }

  const results = [];

  for (const file of req.files) {
    const fileType = getFileType(file.originalname);
    const studentId = db.extractStudentName(file.originalname);
    const relativePath = '/uploads/' + file.filename;

    const artwork = db.artworks.create({
      student_id: studentId,
      file_path: relativePath,
      file_type: fileType,
      file_name: file.filename,
      original_name: file.originalname,
      file_size: file.size,
      semester,
      pending_student: studentId ? 0 : 1,
      is_final_excellent: 0,
      is_hidden: 0,
    });

    results.push({
      id: artwork.id,
      original_name: file.originalname,
      file_type: fileType,
      student_id: studentId,
      pending_student: studentId ? 0 : 1,
      file_path: relativePath,
    });
  }

  res.json({ results });
});

router.post('/single', upload.single('file'), (req, res) => {
  const { semester } = req.body;
  if (!semester) {
    return res.status(400).json({ error: 'Semester is required' });
  }

  const file = req.file;
  const fileType = getFileType(file.originalname);
  const studentId = db.extractStudentName(file.originalname);
  const relativePath = '/uploads/' + file.filename;

  const artwork = db.artworks.create({
    student_id: studentId,
    file_path: relativePath,
    file_type: fileType,
    file_name: file.filename,
    original_name: file.originalname,
    file_size: file.size,
    semester,
    pending_student: studentId ? 0 : 1,
    is_final_excellent: 0,
    is_hidden: 0,
  });

  res.json({
    id: artwork.id,
    original_name: file.originalname,
    file_type: fileType,
    student_id: studentId,
    pending_student: studentId ? 0 : 1,
    file_path: relativePath,
    file_size: file.size,
  });
});

module.exports = router;
