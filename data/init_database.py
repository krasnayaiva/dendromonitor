#!/usr/bin/env python3
import sqlite3
import os

def init_database():
    """Инициализация базы данных"""
    # Создаем папку data если её нет
    os.makedirs('data', exist_ok=True)
    
    db_path = 'data/database.db'
    
    # Подключаемся к базе (она создастся автоматически)
    conn = sqlite3.connect(db_path)
    
    # Создаем таблицы
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
    
    # Проверяем, есть ли уже данные
    cursor = conn.execute('SELECT COUNT(*) FROM trees')
    count = cursor.fetchone()[0]
    
    if count == 0:
        print("Добавляем тестовые данные...")
        
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
        
        # Тестовые комментарии
        test_comments = [
            (1, 'Иван Петров', 'Заметил, что у дерева появились сухие ветки на верхушке', 'ivan@example.com'),
            (2, 'Мария Сидорова', 'Дерево выглядит здоровым, но есть повреждения коры внизу', 'maria@example.com'),
            (3, 'Аноним', 'Около дерева появились грибы, возможно, это признак болезни', '')
        ]
        
        for comment in test_comments:
            conn.execute(
                'INSERT INTO comments (tree_id, user_name, text, contact_email, is_reviewed) VALUES (?, ?, ?, ?, 1)',
                comment
            )
    
    conn.commit()
    conn.close()
    
    print(f"✅ База данных создана: {db_path}")
    print(f"✅ Добавлено {count if count > 0 else 'тестовых'} деревьев")

if __name__ == '__main__':
    init_database()