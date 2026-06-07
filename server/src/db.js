const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const dataDir = path.join(__dirname, '..', 'data');
const dbPath = path.join(dataDir, 'db.json');
const uploadDir = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

let dbData = {
  students: [],
  access_codes: [],
  artworks: [],
  tags: [],
  artwork_tags: [],
  likes: [],
  messages: [],
  semesters: [],
  counters: {},
};

function loadDb() {
  try {
    if (fs.existsSync(dbPath)) {
      const data = fs.readFileSync(dbPath, 'utf-8');
      dbData = JSON.parse(data);
    }
  } catch (err) {
    console.error('加载数据库失败，使用空数据库', err.message);
  }
}

function saveDb() {
  fs.writeFileSync(dbPath, JSON.stringify(dbData, null, 2));
}

function nextId(table) {
  dbData.counters[table] = (dbData.counters[table] || 0) + 1;
  return dbData.counters[table];
}

function createCollection(name) {
  return {
    findAll: (filter = {}) => {
      let rows = [...dbData[name]];
      for (const [key, value] of Object.entries(filter)) {
        if (value !== undefined && value !== null) {
          rows = rows.filter(r => String(r[key]) === String(value));
        }
      }
      return rows;
    },
    findById: (id) => {
      return dbData[name].find(r => r.id === id) || null;
    },
    findOne: (filter) => {
      return dbData[name].find(r => {
        for (const [key, value] of Object.entries(filter)) {
          if (String(r[key]) !== String(value)) return false;
        }
        return true;
      }) || null;
    },
    create: (data) => {
      const row = {
        id: nextId(name),
        created_at: new Date().toISOString(),
        ...data,
      };
      dbData[name].push(row);
      saveDb();
      return row;
    },
    update: (id, data) => {
      const idx = dbData[name].findIndex(r => r.id === id);
      if (idx === -1) return null;
      dbData[name][idx] = { ...dbData[name][idx], ...data, id };
      saveDb();
      return dbData[name][idx];
    },
    delete: (id) => {
      const before = dbData[name].length;
      dbData[name] = dbData[name].filter(r => r.id !== id);
      saveDb();
      return before - dbData[name].length;
    },
    count: (filter = {}) => {
      let rows = [...dbData[name]];
      for (const [key, value] of Object.entries(filter)) {
        if (value !== undefined && value !== null) {
          rows = rows.filter(r => String(r[key]) === String(value));
        }
      }
      return rows.length;
    },
  };
}

const db = {
  students: createCollection('students'),
  access_codes: createCollection('access_codes'),
  artworks: createCollection('artworks'),
  tags: createCollection('tags'),
  artwork_tags: createCollection('artwork_tags'),
  likes: createCollection('likes'),
  messages: createCollection('messages'),
  semesters: createCollection('semesters'),

  getArtworkTags: (artworkId) => {
    const atList = dbData.artwork_tags.filter(at => at.artwork_id === artworkId);
    return atList.map(at => dbData.tags.find(t => t.id === at.tag_id)).filter(Boolean);
  },

  setArtworkTags: (artworkId, tagIds) => {
    dbData.artwork_tags = dbData.artwork_tags.filter(at => at.artwork_id !== artworkId);
    for (const tagId of tagIds) {
      dbData.artwork_tags.push({ artwork_id: artworkId, tag_id: tagId });
    }
    saveDb();
  },

  getArtworksByStudent: (studentId, semester) => {
    let artworks = dbData.artworks.filter(a => a.student_id == studentId);
    if (semester) {
      artworks = artworks.filter(a => a.semester === semester);
    }
    artworks.sort((a, b) => {
      if (a.created_date && b.created_date) return b.created_date.localeCompare(a.created_date);
      return new Date(b.created_at) - new Date(a.created_at);
    });
    return artworks.map(a => ({ ...a, tags: db.getArtworkTags(a.id) }));
  },

  getArtworksWithStudent: (filter = {}) => {
    let artworks = [...dbData.artworks];
    
    if (filter.student_id !== undefined) {
      artworks = artworks.filter(a => a.student_id == filter.student_id);
    }
    if (filter.semester) {
      artworks = artworks.filter(a => a.semester === filter.semester);
    }
    if (filter.pending === true || filter.pending === 'true') {
      artworks = artworks.filter(a => a.pending_student == 1);
    }
    if (filter.is_hidden !== undefined) {
      const val = filter.is_hidden === true || filter.is_hidden === 'true' ? 1 : 0;
      artworks = artworks.filter(a => a.is_hidden == val);
    }
    if (filter.tag_id) {
      const atList = dbData.artwork_tags.filter(at => at.tag_id == filter.tag_id);
      const artworkIds = new Set(atList.map(at => at.artwork_id));
      artworks = artworks.filter(a => artworkIds.has(a.id));
    }

    artworks.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return artworks.map(a => {
      const student = a.student_id ? dbData.students.find(s => s.id == a.student_id) : null;
      const tags = db.getArtworkTags(a.id);
      return { ...a, student, tags };
    });
  },

  verifyAccessCode: (code) => {
    const ac = dbData.access_codes.find(a => a.code === code.toUpperCase().trim());
    if (!ac) return null;

    const student = dbData.students.find(s => s.id === ac.student_id);
    if (!student) return null;

    ac.used_count = (ac.used_count || 0) + 1;
    saveDb();

    return {
      access_code_id: ac.id,
      student_id: student.id,
      student_name: student.name,
      class_name: student.class_name,
      parent_name: ac.parent_name,
    };
  },

  generateAccessCode: (studentId, parentName) => {
    const code = uuidv4().slice(0, 8).toUpperCase();
    return db.access_codes.create({
      code,
      student_id: studentId,
      parent_name: parentName || null,
      used_count: 0,
    });
  },

  toggleLike: (artworkId, accessCodeId) => {
    const existing = dbData.likes.find(
      l => l.artwork_id == artworkId && l.access_code_id == accessCodeId
    );
    if (existing) {
      db.likes.delete(existing.id);
      return { liked: false };
    } else {
      db.likes.create({ artwork_id: artworkId, access_code_id: accessCodeId });
      return { liked: true };
    }
  },

  getLikeCount: (artworkId) => {
    return dbData.likes.filter(l => l.artwork_id == artworkId).length;
  },

  getMyLikes: (accessCodeId) => {
    return dbData.likes
      .filter(l => l.access_code_id == accessCodeId)
      .map(l => l.artwork_id);
  },

  getMessagesGrouped: () => {
    const messages = [...dbData.messages].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );
    const grouped = {};
    for (const msg of messages) {
      if (!grouped[msg.student_id]) {
        const student = dbData.students.find(s => s.id === msg.student_id);
        grouped[msg.student_id] = {
          student,
          messages: [],
          unread_count: 0,
        };
      }
      grouped[msg.student_id].messages.push(msg);
      if (!msg.is_replied) {
        grouped[msg.student_id].unread_count++;
      }
    }
    return Object.values(grouped);
  },

  getTagCategories: () => {
    const categories = {};
    for (const tag of dbData.tags) {
      if (!categories[tag.category]) {
        categories[tag.category] = {
          category: tag.category,
          public_tag_ids: [],
          all_tag_ids: [],
        };
      }
      categories[tag.category].all_tag_ids.push(tag.id);
      if (!tag.is_internal) {
        categories[tag.category].public_tag_ids.push(tag.id);
      }
    }
    return Object.values(categories).sort((a, b) => a.category.localeCompare(b.category));
  },

  extractStudentName: (filename) => {
    const name = path.basename(filename, path.extname(filename));
    for (const student of dbData.students) {
      if (name.includes(student.name)) {
        return student.id;
      }
    }
    return null;
  },
};

function initDb() {
  loadDb();

  if (dbData.semesters.length === 0) {
    db.semesters.create({ name: '2024-2025春季学期', is_current: 1 });
    db.semesters.create({ name: '2024-2025秋季学期', is_current: 0 });
  }

  if (dbData.tags.length === 0) {
    const tags = [
      { name: '美术', category: '学科', is_internal: 0 },
      { name: '设计', category: '学科', is_internal: 0 },
      { name: '手工', category: '学科', is_internal: 0 },
      { name: '写生', category: '项目类型', is_internal: 0 },
      { name: '创作', category: '项目类型', is_internal: 0 },
      { name: '课题', category: '项目类型', is_internal: 0 },
      { name: '水彩', category: '技能', is_internal: 0 },
      { name: '速写', category: '技能', is_internal: 0 },
      { name: '拼贴', category: '技能', is_internal: 0 },
      { name: '油画', category: '技能', is_internal: 0 },
      { name: '素描', category: '技能', is_internal: 0 },
      { name: '综合材料', category: '技能', is_internal: 0 },
      { name: '未完成', category: '状态', is_internal: 1 },
      { name: '重做中', category: '状态', is_internal: 1 },
    ];
    for (const tag of tags) {
      db.tags.create(tag);
    }
  }

  saveDb();
}

initDb();

module.exports = db;
