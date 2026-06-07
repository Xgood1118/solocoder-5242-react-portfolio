const express = require('express');
const fs = require('fs');
const path = require('path');
const db = require('../db');

const router = express.Router();

router.get('/', (req, res) => {
  const { student_id, semester, pending, tag_id, is_hidden } = req.query;
  const filter = {};
  
  if (student_id) filter.student_id = student_id;
  if (semester) filter.semester = semester;
  if (pending === 'true') filter.pending = true;
  if (is_hidden !== undefined) filter.is_hidden = is_hidden;
  if (tag_id) filter.tag_id = tag_id;
  
  const artworks = db.getArtworksWithStudent(filter);
  res.json(artworks);
});

router.get('/likes/mine', (req, res) => {
  const { access_code_id } = req.query;
  if (!access_code_id) return res.status(400).json({ error: 'access_code_id is required' });
  
  const likes = db.getMyLikes(parseInt(access_code_id));
  res.json(likes);
});

router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const artwork = db.artworks.findById(id);
  if (!artwork) return res.status(404).json({ error: 'Artwork not found' });

  const tags = db.getArtworkTags(id);
  const student = artwork.student_id 
    ? db.students.findById(artwork.student_id) 
    : null;

  res.json({ ...artwork, tags, student });
});

router.get('/:id/likes', (req, res) => {
  const count = db.getLikeCount(parseInt(req.params.id));
  res.json({ count });
});

router.post('/:id/like', (req, res) => {
  const { access_code_id } = req.body;
  if (!access_code_id) return res.status(400).json({ error: 'access_code_id is required' });
  
  const result = db.toggleLike(parseInt(req.params.id), parseInt(access_code_id));
  res.json(result);
});

router.post('/', (req, res) => {
  const {
    student_id, title, description, file_path, file_type, file_name, file_size,
    original_name, semester, grade, comment, materials, created_date,
    is_final_excellent, is_hidden,
  } = req.body;

  if (!file_path || !file_type || !file_name || !semester) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const artwork = db.artworks.create({
    student_id: student_id || null,
    title: title || null,
    description: description || null,
    file_path,
    file_type,
    file_name,
    original_name: original_name || null,
    file_size: file_size || null,
    semester,
    grade: grade || null,
    comment: comment || null,
    materials: materials || null,
    created_date: created_date || null,
    is_final_excellent: is_final_excellent ? 1 : 0,
    is_hidden: is_hidden ? 1 : 0,
    pending_student: student_id ? 0 : 1,
  });

  res.json({ id: artwork.id });
});

router.put('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const existing = db.artworks.findById(id);
  if (!existing) return res.status(404).json({ error: 'Artwork not found' });

  const {
    student_id, title, description, semester, grade, comment, materials,
    created_date, is_final_excellent, is_hidden, pending_student, tag_ids,
  } = req.body;

  const updates = {};
  if (student_id !== undefined) updates.student_id = student_id;
  if (title !== undefined) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (semester !== undefined) updates.semester = semester;
  if (grade !== undefined) updates.grade = grade;
  if (comment !== undefined) updates.comment = comment;
  if (materials !== undefined) updates.materials = materials;
  if (created_date !== undefined) updates.created_date = created_date;
  if (is_final_excellent !== undefined) updates.is_final_excellent = is_final_excellent ? 1 : 0;
  if (is_hidden !== undefined) updates.is_hidden = is_hidden ? 1 : 0;
  if (pending_student !== undefined) updates.pending_student = pending_student ? 1 : 0;

  const artwork = db.artworks.update(id, updates);

  if (tag_ids && Array.isArray(tag_ids)) {
    db.setArtworkTags(id, tag_ids);
  }

  res.json(artwork);
});

router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const artwork = db.artworks.findById(id);
  
  if (artwork && artwork.file_path) {
    const filePath = path.join(__dirname, '..', '..', artwork.file_path);
    if (fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch (e) {}
    }
  }
  
  db.artworks.delete(id);
  res.json({ success: true });
});

router.post('/:id/tags', (req, res) => {
  const { tag_ids } = req.body;
  if (!Array.isArray(tag_ids)) {
    return res.status(400).json({ error: 'tag_ids must be an array' });
  }

  const id = parseInt(req.params.id);
  db.setArtworkTags(id, tag_ids);
  
  const tags = db.getArtworkTags(id);
  res.json(tags);
});

module.exports = router;
