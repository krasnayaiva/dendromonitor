const sqlite = require('better-sqlite3');

// Путь к базе данных (в Netlify Functions нет постоянного хранилища, используем память)
let db;

function getDB() {
  if (!db) {
    // Используем базу в памяти для демонстрации
    db = new sqlite(':memory:');
    initDB(db);
  }
  return db;
}

function initDB(db) {
  // Создаем таблицы
  db.exec(`
    CREATE TABLE IF NOT EXISTS trees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      species TEXT NOT NULL,
      address TEXT,
      diameter REAL,
      height REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS tree_status (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tree_id INTEGER,
      status TEXT NOT NULL,
      notes TEXT,
      date_recorded DATE DEFAULT CURRENT_DATE,
      is_future_plan BOOLEAN DEFAULT 0,
      FOREIGN KEY (tree_id) REFERENCES trees (id)
    )
  `);

  // Добавляем тестовые данные если таблицы пустые
  const treeCount = db.prepare('SELECT COUNT(*) as count FROM trees').get();
  if (treeCount.count === 0) {
    const testTrees = [
      [55.7558, 37.6176, 'Дуб', 'Красная площадь, 1', 85.5, 25.0],
      [55.7520, 37.6175, 'Береза', 'ул. Тверская, 10', 45.2, 18.5],
      [55.7500, 37.6200, 'Сосна', 'Парк Горького, центральная аллея', 92.1, 30.2],
    ];

    const insertTree = db.prepare(`
      INSERT INTO trees (latitude, longitude, species, address, diameter, height) 
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const insertStatus = db.prepare(`
      INSERT INTO tree_status (tree_id, status, notes) VALUES (?, ?, ?)
    `);

    testTrees.forEach((tree, index) => {
      const result = insertTree.run(...tree);
      insertStatus.run(result.lastInsertRowid, 
        ['excellent', 'good', 'satisfactory'][index],
        ['Дерево в отличном состоянии', 'Небольшие повреждения коры', 'Требуется санитарная обрезка'][index]
      );
    });
  }
}

exports.handler = async function(event, context) {
  const db = getDB();
  
  try {
    const { id } = event.queryStringParameters || {};
    
    if (id) {
      // Получение конкретного дерева
      const tree = db.prepare(`
        SELECT * FROM trees WHERE id = ?
      `).get(id);

      if (!tree) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'Tree not found' })
        };
      }

      const statusHistory = db.prepare(`
        SELECT * FROM tree_status 
        WHERE tree_id = ? 
        ORDER BY date_recorded DESC
      `).all(id);

      const comments = db.prepare(`
        SELECT * FROM comments 
        WHERE tree_id = ? AND is_reviewed = 1
        ORDER BY created_at DESC
      `).all(id);

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tree,
          status_history: statusHistory,
          comments: comments
        })
      };
    } else {
      // Получение всех деревьев
      const trees = db.prepare(`
        SELECT t.*, ts.status, ts.notes as status_notes
        FROM trees t
        LEFT JOIN tree_status ts ON t.id = ts.tree_id
        WHERE ts.id = (
          SELECT id FROM tree_status 
          WHERE tree_id = t.id 
          ORDER BY date_recorded DESC, id DESC 
          LIMIT 1
        )
        OR ts.id IS NULL
      `).all();

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trees)
      };
    }
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};