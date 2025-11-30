#!/usr/bin/env python3
import sqlite3
import json
import os
from http import cookies
import cgi

def get_db_connection():
    """Создание подключения к базе данных"""
    db_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'database.db')
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn

def init_database():
    """Инициализация базы данных"""
    conn = get_db_connection()
    
    # Создание таблиц
    conn.execute('''
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
    ''')
    
    conn.execute('''
        CREATE TABLE IF NOT EXISTS tree_status (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tree_id INTEGER,
            status TEXT NOT NULL,
            notes TEXT,
            date_recorded DATE DEFAULT CURRENT_DATE,
            is_future_plan BOOLEAN DEFAULT 0,
            FOREIGN KEY (tree_id) REFERENCES trees (id)
        )
    ''')
    
    conn.execute('''
        CREATE TABLE IF NOT EXISTS comments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tree_id INTEGER,
            user_name TEXT,
            text TEXT NOT NULL,
            contact_email TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            is_reviewed BOOLEAN DEFAULT 0,
            FOREIGN KEY (tree_id) REFERENCES trees (id)
        )
    ''')
    
    # Добавление тестовых данных, если таблицы пустые
    cursor = conn.execute('SELECT COUNT(*) as count FROM trees')
    if cursor.fetchone()['count'] == 0:
        # Тестовые деревья
        test_trees = [
            (55.7558, 37.6176, 'Дуб', 'Красная площадь, 1', 85.5, 25.0),
            (55.7520, 37.6175, 'Береза', 'ул. Тверская, 10', 45.2, 18.5),
            (55.7500, 37.6200, 'Сосна', 'Парк Горького, центральная аллея', 92.1, 30.2),
            (55.7490, 37.6150, 'Клен', 'ул. Большая Дмитровка, 15', 32.8, 12.3),
            (55.7475, 37.6225, 'Липа', 'Чистопрудный бульвар', 68.7, 22.1)
        ]
        
        for tree in test_trees:
            conn.execute(
                'INSERT INTO trees (latitude, longitude, species, address, diameter, height) VALUES (?, ?, ?, ?, ?, ?)',
                tree
            )
        
        # Тестовые статусы
        test_statuses = [
            (1, 'excellent', 'Дерево в отличном состоянии'),
            (2, 'good', 'Небольшие повреждения коры'),
            (3, 'satisfactory', 'Требуется санитарная обрезка'),
            (4, 'poor', 'Признаки заболевания'),
            (5, 'critical', 'Сильное повреждение ствола')
        ]
        
        for status in test_statuses:
            conn.execute(
                'INSERT INTO tree_status (tree_id, status, notes) VALUES (?, ?, ?)',
                status
            )
    
    conn.commit()
    conn.close()

def get_trees():
    """Получение списка всех деревьев с их текущим статусом"""
    conn = get_db_connection()
    
    trees = conn.execute('''
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
    ''').fetchall()
    
    conn.close()
    
    return [dict(tree) for tree in trees]

def get_tree(tree_id):
    """Получение информации о конкретном дереве"""
    conn = get_db_connection()
    
    tree = conn.execute('''
        SELECT * FROM trees WHERE id = ?
    ''', (tree_id,)).fetchone()
    
    if not tree:
        conn.close()
        return None
    
    status_history = conn.execute('''
        SELECT * FROM tree_status 
        WHERE tree_id = ? 
        ORDER BY date_recorded DESC
    ''', (tree_id,)).fetchall()
    
    comments = conn.execute('''
        SELECT * FROM comments 
        WHERE tree_id = ? AND is_reviewed = 1
        ORDER BY created_at DESC
    ''', (tree_id,)).fetchall()
    
    conn.close()
    
    return {
        'tree': dict(tree),
        'status_history': [dict(status) for status in status_history],
        'comments': [dict(comment) for comment in comments]
    }

def main():
    """Основная функция обработки запросов"""
    # Инициализация базы данных
    init_database()
    
    # Получение параметров запроса
    import cgi
    field_storage = cgi.FieldStorage()
    tree_id = field_storage.getvalue('id')
    
    # Установка заголовков для CORS и JSON
    print("Content-Type: application/json; charset=utf-8")
    print("Access-Control-Allow-Origin: *")
    print("Access-Control-Allow-Methods: GET, POST, OPTIONS")
    print("Access-Control-Allow-Headers: Content-Type")
    print()
    
    try:
        if tree_id:
            # Запрос конкретного дерева
            tree_data = get_tree(int(tree_id))
            if tree_data:
                print(json.dumps(tree_data, ensure_ascii=False))
            else:
                print(json.dumps({'error': 'Tree not found'}, ensure_ascii=False))
        else:
            # Запрос всех деревьев
            trees = get_trees()
            print(json.dumps(trees, ensure_ascii=False))
            
    except Exception as e:
        print(json.dumps({'error': str(e)}, ensure_ascii=False))

if __name__ == '__main__':
    main()