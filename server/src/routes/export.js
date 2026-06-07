const express = require('express');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const db = require('../db');

const router = express.Router();

router.get('/student/:studentId/semester/:semester', (req, res) => {
  const { studentId, semester } = req.params;

  const student = db.students.findById(parseInt(studentId));
  if (!student) return res.status(404).json({ error: 'Student not found' });

  const artworks = db.getArtworksByStudent(parseInt(studentId), semester)
    .filter(a => !a.is_hidden);

  const html = generatePortfolioHTML(student, semester, artworks, false);

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${student.name}_${semester}_作品集.html"`);
  res.send(html);
});

router.get('/student/:studentId/semester/:semester/zip', (req, res) => {
  const { studentId, semester } = req.params;

  const student = db.students.findById(parseInt(studentId));
  if (!student) return res.status(404).json({ error: 'Student not found' });

  const artworks = db.getArtworksByStudent(parseInt(studentId), semester)
    .filter(a => !a.is_hidden);

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(student.name + '_' + semester + '_作品集')}.zip"`);

  const archive = archiver('zip', { zlib: { level: 9 } });
  archive.pipe(res);

  const html = generatePortfolioHTML(student, semester, artworks, true);
  archive.append(html, { name: 'index.html' });

  for (const artwork of artworks) {
    const filePath = path.join(__dirname, '..', '..', artwork.file_path);
    if (fs.existsSync(filePath)) {
      const ext = path.extname(artwork.file_name || artwork.file_path);
      archive.file(filePath, { name: `artworks/${artwork.id}${ext}` });
    }
  }

  archive.finalize();
});

function generatePortfolioHTML(student, semester, artworks, useLocalFiles) {
  const gradeLabels = { A: '优秀', B: '良好', C: '及格', D: '需努力' };
  const gradeColors = { A: '#52c41a', B: '#1890ff', C: '#faad14', D: '#ff4d4f' };

  const artworkCards = artworks.map((artwork, index) => {
    const imgSrc = useLocalFiles 
      ? `artworks/${artwork.id}${path.extname(artwork.file_name || artwork.file_path)}`
      : `${artwork.file_path}`;

    let mediaHtml = '';
    if (artwork.file_type === 'image') {
      mediaHtml = `<img src="${imgSrc}" alt="${artwork.title || '作品'}" style="width:100%;height:auto;border-radius:8px;">`;
    } else if (artwork.file_type === 'video') {
      mediaHtml = `<video src="${imgSrc}" controls style="width:100%;border-radius:8px;"></video>`;
    } else if (artwork.file_type === 'pdf') {
      mediaHtml = `<iframe src="${imgSrc}" style="width:100%;height:500px;border:1px solid #ddd;border-radius:8px;"></iframe>`;
    }

    const tagsHtml = artwork.tags && artwork.tags.length > 0
      ? artwork.tags.filter(t => !t.is_internal).map(t => 
          `<span style="display:inline-block;padding:2px 8px;background:#f0f0f0;border-radius:12px;font-size:12px;margin-right:4px;">${t.name}</span>`
        ).join('')
      : '';

    const gradeBadge = artwork.grade
      ? `<span style="display:inline-block;padding:4px 12px;background:${gradeColors[artwork.grade]};color:#fff;border-radius:16px;font-weight:bold;">${artwork.grade} - ${gradeLabels[artwork.grade] || ''}</span>`
      : '';

    const excellentBadge = artwork.is_final_excellent
      ? `<span style="display:inline-block;padding:4px 12px;background:#faad14;color:#fff;border-radius:16px;font-weight:bold;margin-left:8px;">🏆 期末优秀</span>`
      : '';

    return `
      <div style="background:#fff;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.1);padding:24px;margin-bottom:24px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
          <h3 style="margin:0;font-size:20px;color:#333;">${artwork.title || artwork.original_name || '作品 ' + (index + 1)}</h3>
          <div>${gradeBadge}${excellentBadge}</div>
        </div>
        ${mediaHtml}
        <div style="margin-top:16px;">
          ${artwork.comment ? `<p style="color:#666;line-height:1.6;"><strong>老师评语：</strong>${artwork.comment}</p>` : ''}
          ${artwork.materials ? `<p style="color:#666;"><strong>材料：</strong>${artwork.materials}</p>` : ''}
          ${artwork.created_date ? `<p style="color:#999;font-size:14px;">创作日期：${artwork.created_date}</p>` : ''}
          ${tagsHtml ? `<div style="margin-top:12px;">${tagsHtml}</div>` : ''}
        </div>
      </div>
    `;
  }).join('');

  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${student.name} - ${semester} 作品集</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #f5f5f5; color: #333; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff; padding: 48px 24px; text-align: center; }
    .header h1 { font-size: 32px; margin-bottom: 8px; }
    .header p { font-size: 16px; opacity: 0.9; }
    .container { max-width: 900px; margin: 0 auto; padding: 24px; }
    .stats { display: flex; gap: 16px; margin-bottom: 24px; }
    .stat-card { flex: 1; background: #fff; padding: 20px; border-radius: 12px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .stat-card h2 { font-size: 28px; color: #667eea; margin-bottom: 4px; }
    .stat-card p { color: #999; font-size: 14px; }
    .footer { text-align: center; padding: 32px; color: #999; font-size: 14px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎨 ${student.name} 的作品集</h1>
    <p>${semester} | ${student.class_name || ''}</p>
  </div>
  <div class="container">
    <div class="stats">
      <div class="stat-card">
        <h2>${artworks.length}</h2>
        <p>作品数量</p>
      </div>
      <div class="stat-card">
        <h2>${artworks.filter(a => a.grade === 'A').length}</h2>
        <p>优秀作品</p>
      </div>
      <div class="stat-card">
        <h2>${artworks.filter(a => a.is_final_excellent).length}</h2>
        <p>期末优秀</p>
      </div>
    </div>
    ${artworkCards || '<p style="text-align:center;padding:48px;color:#999;">暂无作品</p>'}
  </div>
  <div class="footer">
    <p>本作品集由学生作品集管理系统生成</p>
  </div>
</body>
</html>
  `;
}

module.exports = router;
