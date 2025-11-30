const sqlite = require('better-sqlite3');

let db;

function getDB() {
  if (!db) {
    db = new sqlite(':memory:');
    initDB(db);
  }
  return db;
}

function initDB(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tree_id INTEGER,
      user_name TEXT,
      text TEXT NOT NULL,
      contact_email TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_reviewed BOOLEAN DEFAULT 0
    )
  `);
}

exports.handler = async function(event, context) {
  const db = getDB();
  
  try {
    if (event.httpMethod === 'POST') {
      const data = JSON.parse(event.body);
      
      const result = db.prepare(`
        INSERT INTO comments (tree_id, user_name, text, contact_email, is_reviewed)
        VALUES (?, ?, ?, ?, 1)
      `).run(data.tree_id, data.user_name || '', data.text, data.contact_email || '');
      
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          success: true, 
          comment_id: result.lastInsertRowid 
        })
      };
    } else {
      const { tree_id } = event.queryStringParameters || {};
      
      if (!tree_id) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'tree_id parameter required' })
        };
      }
      
      const comments = db.prepare(`
        SELECT * FROM comments 
        WHERE tree_id = ? AND is_reviewed = 1
        ORDER BY created_at DESC
      `).all(tree_id);
      
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(comments)
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