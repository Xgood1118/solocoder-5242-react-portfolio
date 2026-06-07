const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.use('/api/students', require('./routes/students'));
app.use('/api/artworks', require('./routes/artworks'));
app.use('/api/tags', require('./routes/tags'));
app.use('/api/access', require('./routes/access'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/semesters', require('./routes/semesters'));
app.use('/api/export', require('./routes/export'));
app.use('/api/upload', require('./routes/upload'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
