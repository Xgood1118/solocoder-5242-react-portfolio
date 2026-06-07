const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/', (req, res) => {
  const { category, internal } = req.query;
  
  let tags = db.tags.findAll();
  
  if (category) {
    tags = tags.filter(t => t.category === category);
  }
  if (internal === 'false') {
    tags = tags.filter(t => !t.is_internal);
  }
  
  tags.sort((a, b) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    return a.name.localeCompare(b.name);
  });
  
  res.json(tags);
});

router.get('/categories', (req, res) => {
  const categories = db.getTagCategories();
  res.json(categories);
});

router.post('/', (req, res) => {
  const { name, category, is_internal } = req.body;
  if (!name || !category) {
    return res.status(400).json({ error: 'Name and category are required' });
  }

  const tag = db.tags.create({
    name,
    category,
    is_internal: is_internal ? 1 : 0,
  });

  res.json(tag);
});

router.put('/:id', (req, res) => {
  const { name, category, is_internal } = req.body;
  const id = parseInt(req.params.id);
  
  const tag = db.tags.update(id, {
    name,
    category,
    is_internal: is_internal ? 1 : 0,
  });

  if (!tag) return res.status(404).json({ error: 'Tag not found' });
  res.json(tag);
});

router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  db.tags.delete(id);
  res.json({ success: true });
});

module.exports = router;
