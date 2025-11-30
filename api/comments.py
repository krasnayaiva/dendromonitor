#!/usr/bin/env python3
import sqlite3
import json
import os
import sys
from urllib.parse import parse_qs

def get_db_connection():
    """Создание подключения к базе данных"""
    db_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'database.db')
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn

def add_comment(tree_id, user_name, text, contact_email):
    """Добавление нового комментария"""
    conn = get_db_connection()
    
    try:
        conn.execute('''
            INSERT INTO comments (tree_id, user_name, text, contact_email)
            VALUES (?, ?, ?, ?)
        ''', (tree_id, user_name, text, contact_email))
        
        conn.commit()
        comment_id = conn.lastrowid
        conn.close()
        
        return {'success': True, 'comment_id': comment_id}
        
    except Exception as e:
        conn.close()
        return {'success': False, 'error': str(e)}

def get_comments(tree_id):
    """Получение комментариев для дерева"""
    conn = get_db_connection()
    
    comments = conn.execute('''
        SELECT * FROM comments 
        WHERE tree_id = ? AND is_reviewed = 1
        ORDER BY created_at DESC
    ''', (tree_id,)).fetchall()
    
    conn.close()
    return [dict(comment) for comment in comments]

def main():
    """Основная функция обработки запросов"""
    # Установка заголовков
    print("Content-Type: application/json; charset=utf-8")
    print("Access-Control-Allow-Origin: *")
    print("Access-Control-Allow-Methods: GET, POST, OPTIONS")
    print("Access-Control-Allow-Headers: Content-Type")
    print()
    
    try:
        if os.environ.get('REQUEST_METHOD') == 'POST':
            # Чтение данных POST запроса
            content_length = int(os.environ.get('CONTENT_LENGTH', 0))
            post_data = sys.stdin.read(content_length)
            data = json.loads(post_data)
            
            # Добавление комментария
            result = add_comment(
                data.get('tree_id'),
                data.get('user_name', ''),
                data.get('text'),
                data.get('contact_email', '')
            )
            
            print(json.dumps(result, ensure_ascii=False))
            
        else:
            # GET запрос - получение комментариев
            import cgi
            field_storage = cgi.FieldStorage()
            tree_id = field_storage.getvalue('tree_id')
            
            if tree_id:
                comments = get_comments(int(tree_id))
                print(json.dumps(comments, ensure_ascii=False))
            else:
                print(json.dumps({'error': 'tree_id parameter required'}, ensure_ascii=False))
                
    except Exception as e:
        print(json.dumps({'success': False, 'error': str(e)}, ensure_ascii=False))

if __name__ == '__main__':
    main()