#!/usr/bin/env python3
import sqlite3
import json
import os
import sys
from datetime import date

def get_db_connection():
    """Создание подключения к базе данных"""
    db_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'database.db')
    # Создаем папку data если её нет
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn

def init_database():
    """Инициализация базы данных если её нет"""
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
    
    # Добавляем тестовые данные, если таблицы пустые
    cursor = conn.execute('SELECT COUNT(*) as count FROM trees')
    if cursor.fetchone()[0] == 0:
        # Тестовые деревья
        test_trees = [
            (55.7558, 37.6176, 'Дуб', 'Красная площадь, 1', 85.5, 25.0),
            (55.7520, 37.6175, 'Береза', 'ул. Тверская, 10', 45.2, 18.5),
            (55.7500, 37.6200, 'Сосна', 'Парк Горького, центральная аллея', 92.1, 30.2),
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
        ]
        
        for status in test_statuses:
            conn.execute(
                'INSERT INTO tree_status (tree_id, status, notes) VALUES (?, ?, ?)',
                status
            )
    
    conn.commit()
    conn.close()

def add_tree(tree_data):
    """Добавление нового дерева в базу данных"""
    conn = get_db_connection()
    
    try:
        # Добавляем дерево
        cursor = conn.execute('''
            INSERT INTO trees (latitude, longitude, species, address, diameter, height)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            tree_data['latitude'],
            tree_data['longitude'],
            tree_data['species'],
            tree_data['address'],
            tree_data.get('diameter'),
            tree_data.get('height')
        ))
        
        tree_id = cursor.lastrowid
        
        # Добавляем первоначальный статус
        conn.execute('''
            INSERT INTO tree_status (tree_id, status, notes, date_recorded)
            VALUES (?, ?, ?, ?)
        ''', (
            tree_id,
            tree_data['status'],
            tree_data.get('notes', ''),
            date.today().isoformat()
        ))
        
        conn.commit()
        
        # Получаем добавленное дерево для ответа
        tree = conn.execute('''
            SELECT t.*, ts.status 
            FROM trees t
            LEFT JOIN tree_status ts ON t.id = ts.tree_id
            WHERE t.id = ? AND ts.id = (
                SELECT id FROM tree_status 
                WHERE tree_id = t.id 
                ORDER BY date_recorded DESC 
                LIMIT 1
            )
        ''', (tree_id,)).fetchone()
        
        return {
            'success': True,
            'tree_id': tree_id,
            'tree': dict(tree)
        }
        
    except Exception as e:
        conn.rollback()
        return {'success': False, 'error': str(e)}
        
    finally:
        conn.close()

def main():
    """Основная функция обработки запросов"""
    # Инициализация базы данных
    init_database()
    
    # Установка заголовков
    print("Content-Type: application/json; charset=utf-8")
    print("Access-Control-Allow-Origin: *")
    print("Access-Control-Allow-Methods: GET, POST, OPTIONS")
    print("Access-Control-Allow-Headers: Content-Type")
    print()
    
    try:
        # Получаем метод запроса
        request_method = os.environ.get('REQUEST_METHOD', 'GET')
        
        if request_method == 'POST':
            # Чтение данных POST запроса
            content_length = int(os.environ.get('CONTENT_LENGTH', 0))
            if content_length > 0:
                post_data = sys.stdin.read(content_length)
                data = json.loads(post_data)
                
                # Добавление дерева
                result = add_tree(data)
                print(json.dumps(result, ensure_ascii=False))
            else:
                print(json.dumps({'success': False, 'error': 'No data received'}, ensure_ascii=False))
                
        else:
            print(json.dumps({'error': 'Only POST method allowed'}, ensure_ascii=False))
            
    except Exception as e:
        print(json.dumps({'success': False, 'error': str(e)}, ensure_ascii=False))

if __name__ == '__main__':
    main()