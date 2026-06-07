const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/', (req, res) => {
  const { student_id, access_code_id } = req.query;
  const filter = {};
  
  if (student_id) filter.student_id = student_id;
  if (access_code_id) filter.access_code_id = access_code_id;
  
  let messages = db.messages.findAll(filter);
  messages.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  
  const result = messages.map(msg => {
    const student = db.students.findById(msg.student_id);
    return { ...msg, student };
  });
  
  res.json(result);
});

router.get('/by-student', (req, res) => {
  const grouped = db.getMessagesGrouped();
  res.json(grouped);
});

router.post('/', (req, res) => {
  const { student_id, access_code_id, content, parent_name } = req.body;
  if (!student_id || !content) {
    return res.status(400).json({ error: 'student_id and content are required' });
  }

  const message = db.messages.create({
    student_id: parseInt(student_id),
    access_code_id: access_code_id ? parseInt(access_code_id) : null,
    content,
    parent_name: parent_name || null,
    reply: null,
    is_replied: 0,
  });

  res.json(message);
});

router.post('/:id/reply', (req, res) => {
  const { reply } = req.body;
  if (!reply) return res.status(400).json({ error: 'Reply content is required' });

  const id = parseInt(req.params.id);
  const message = db.messages.update(id, {
    reply,
    is_replied: 1,
  });

  if (!message) return res.status(404).json({ error: 'Message not found' });
  res.json(message);
});

module.exports = router;
