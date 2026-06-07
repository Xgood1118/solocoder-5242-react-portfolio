const db = require('./db');
const path = require('path');
const fs = require('fs');

function seed() {
  console.log('开始添加种子数据...');

  if (db.students.findAll().length > 0) {
    console.log('已有学生数据，跳过种子数据');
    return;
  }

  const students = [
    { name: '张小明', class_name: '一班', grade: '三年级' },
    { name: '李小红', class_name: '一班', grade: '三年级' },
    { name: '王小华', class_name: '二班', grade: '三年级' },
    { name: '赵小芳', class_name: '二班', grade: '三年级' },
    { name: '陈小伟', class_name: '三班', grade: '三年级' },
    { name: '刘小美', class_name: '三班', grade: '三年级' },
  ];

  const createdStudents = students.map(s => db.students.create(s));
  console.log(`添加了 ${createdStudents.length} 个学生`);

  for (const student of createdStudents) {
    db.generateAccessCode(student.id, `${student.name}家长`);
  }
  console.log('为每个学生生成了访问码');

  const uploadDir = path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const sampleImages = [
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2Y2ZDZjNSIvPjxjaXJjbGUgY3g9IjIwMCIgY3k9IjEwMCIgcj0iNTAiIGZpbGw9IiNmZmE2ZDYiLz48cmVjdCB4PSI4MCIgeT0iMTUwIiB3aWR0aD0iMjQwIiBoZWlnaHQ9IjEyMCIgZmlsbD0iIzdmYzZhNyIvPjx0ZXh0IHg9IjIwMCIgeT0iMjIwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj7nvZHnq5vlkI08L3RleHQ+PC9zdmc+',
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iIzk1ZTFlMCIvPjxwb2x5Z29uIHBvaW50cz0iMjAwLDUwIDM1MCwyNTAgNTAsMjUwIiBmaWxsPSIjZmZmYjAwIi8+PHRleHQgeD0iMjAwIiB5PSIyODAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPuaVsOWtpuS4gDwvdGV4dD48L3N2Zz4=',
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iIzFkNGI3NyIvPjxjaXJjbGUgY3g9IjEwMCIgY3k9IjgwIiByPSIzMCIgZmlsbD0iI2ZmZjBjNyIvPjxjaXJjbGUgY3g9IjI1MCIgY3k9IjUwIiByPSIyMCIgZmlsbD0iI2ZmZjBjNyIvPjxjaXJjbGUgY3g9IjM1MCIgY3k9IjkwIiByPSIyNSIgZmlsbD0iI2ZmZjBjNyIvPjxyZWN0IHg9IjAiIHk9IjIwMCIgd2lkdGg9IjQwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiMwZThkZDkiLz48dGV4dCB4PSIyMDAiIHk9IjI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjIwIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+5aSn5rWm5aOw5pmoPC90ZXh0Pjwvc3ZnPg==',
  ];

  const semesters = ['2024-2025春季学期', '2024-2025秋季学期'];

  for (let i = 0; i < createdStudents.length; i++) {
    const student = createdStudents[i];
    for (let j = 0; j < 4; j++) {
      const svgIndex = (i + j) % sampleImages.length;
      const svgBuffer = Buffer.from(sampleImages[svgIndex].split(',')[1], 'base64');
      const fileName = `${student.name}_作品${j + 1}.svg`;
      const filePath = path.join(uploadDir, `demo_${student.id}_${j}.svg`);
      fs.writeFileSync(filePath, svgBuffer);

      const grades = ['A', 'B', 'B', 'C'];
      const comments = [
        '构图完整，色彩搭配和谐，继续保持！',
        '画面表现力很强，注意细节处理。',
        '进步很大，继续努力！',
        '基础扎实，可以尝试更复杂的题材。',
      ];
      const materials = ['水彩', '素描', '油画', '综合材料'];

      db.artworks.create({
        student_id: student.id,
        title: `${student.name}的作品 ${j + 1}`,
        description: '',
        file_path: `/uploads/demo_${student.id}_${j}.svg`,
        file_type: 'image',
        file_name: `demo_${student.id}_${j}.svg`,
        original_name: fileName,
        file_size: svgBuffer.length,
        semester: semesters[j % 2],
        grade: grades[j],
        comment: comments[j],
        materials: materials[j],
        created_date: `2025-0${j + 1}-15`,
        is_final_excellent: j === 0 ? 1 : 0,
        is_hidden: 0,
        pending_student: 0,
      });
    }
  }
  console.log('添加了示例作品');

  const allArtworks = db.artworks.findAll();
  const allTags = db.tags.findAll();
  const publicTags = allTags.filter(t => !t.is_internal);

  for (let i = 0; i < allArtworks.length; i++) {
    const artwork = allArtworks[i];
    const numTags = (i % 3) + 1;
    const shuffled = [...publicTags].sort(() => Math.random() - 0.5);
    const selectedTags = shuffled.slice(0, numTags);
    for (const tag of selectedTags) {
      db.artwork_tags.create({ artwork_id: artwork.id, tag_id: tag.id });
    }
  }
  console.log('为作品添加了标签');

  db.messages.create({
    student_id: createdStudents[0].id,
    access_code_id: null,
    content: '老师好，请问孩子最近在学校表现怎么样？',
    parent_name: '张小明爸爸',
    reply: '小明爸爸您好，小明最近进步很大，尤其在色彩运用方面很有天赋。',
    is_replied: 1,
  });

  db.messages.create({
    student_id: createdStudents[1].id,
    access_code_id: null,
    content: '老师，小红说想报美术兴趣班，您觉得她适合吗？',
    parent_name: '李小红妈妈',
    reply: null,
    is_replied: 0,
  });

  console.log('添加了示例留言');
  console.log('种子数据添加完成！');

  const accessCodes = db.access_codes.findAll();
  console.log('\n=== 家长访问码 ===');
  for (const ac of accessCodes) {
    const student = db.students.findById(ac.student_id);
    console.log(`${student.name}: ${ac.code}`);
  }
}

seed();

module.exports = seed;
