const express = require('express');
const db = require('../db');

const router = express.Router();

router.post('/verify', (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'Code is required' });

  const result = db.verifyAccessCode(code);
  if (!result) return res.status(401).json({ error: '无效的访问码' });

  res.json(result);
});

router.get('/student/:student_id', (req, res) => {
  const studentId = parseInt(req.params.student_id);
  const codes = db.access_codes.findAll({ student_id: studentId });
  codes.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json(codes);
});

router.post('/student/:student_id', (req, res) => {
  const { parent_name } = req.body;
  const studentId = parseInt(req.params.student_id);
  
  const accessCode = db.generateAccessCode(studentId, parent_name);
  res.json(accessCode);
});

router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  db.access_codes.delete(id);
  res.json({ success: true });
});

module.exports = router;
