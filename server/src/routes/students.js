const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/', (req, res) => {
  const { class_name } = req.query;
  const filter = {};
  if (class_name) filter.class_name = class_name;
  
  const students = db.students.findAll(filter);
  students.sort((a, b) => a.name.localeCompare(b.name));
  
  const result = students.map(student => ({
    ...student,
    artwork_count: db.artworks.count({ student_id: student.id }),
  }));
  
  res.json(result);
});

router.get('/:id', (req, res) => {
  const student = db.students.findById(parseInt(req.params.id));
  if (!student) return res.status(404).json({ error: 'Student not found' });
  res.json(student);
});

router.post('/', (req, res) => {
  const { name, class_name, grade } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  
  const student = db.students.create({
    name,
    class_name: class_name || null,
    grade: grade || null,
  });
  
  db.generateAccessCode(student.id, null);
  
  res.json(student);
});

router.put('/:id', (req, res) => {
  const { name, class_name, grade } = req.body;
  const id = parseInt(req.params.id);
  
  const student = db.students.update(id, {
    name,
    class_name: class_name || null,
    grade: grade || null,
  });
  
  if (!student) return res.status(404).json({ error: 'Student not found' });
  res.json(student);
});

router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const count = db.students.delete(id);
  res.json({ success: count > 0 });
});

router.get('/:id/artworks', (req, res) => {
  const { semester } = req.query;
  const artworks = db.getArtworksByStudent(parseInt(req.params.id), semester);
  res.json(artworks);
});

module.exports = router;
