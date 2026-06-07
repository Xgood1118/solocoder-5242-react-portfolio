const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/', (req, res) => {
  const semesters = db.semesters.findAll();
  semesters.sort((a, b) => b.name.localeCompare(a.name));
  res.json(semesters);
});

router.get('/current', (req, res) => {
  const semester = db.semesters.findAll().find(s => s.is_current);
  res.json(semester || null);
});

router.post('/', (req, res) => {
  const { name, is_current } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });

  if (is_current) {
    for (const s of db.semesters.findAll()) {
      db.semesters.update(s.id, { is_current: 0 });
    }
  }

  const semester = db.semesters.create({
    name,
    is_current: is_current ? 1 : 0,
  });

  res.json(semester);
});

router.put('/:id/set-current', (req, res) => {
  const id = parseInt(req.params.id);
  
  for (const s of db.semesters.findAll()) {
    db.semesters.update(s.id, { is_current: 0 });
  }
  
  const semester = db.semesters.update(id, { is_current: 1 });
  res.json(semester);
});

router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  db.semesters.delete(id);
  res.json({ success: true });
});

module.exports = router;
