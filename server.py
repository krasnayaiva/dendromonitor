#!/usr/bin/env python3
import http.server
import socketserver
import sqlite3
import os
import json
from urllib.parse import urlparse, parse_qs
from datetime import date

class DendroMonitorHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Кастомный HTTP обработчик для API endpoints"""
    
    def do_GET(self):
        # Обработка API запросов
        if self.path.startswith('/api/'):
            self.handle_api_request()
        else:
            # Статические файлы
            super().do_GET()
    
    def do_POST(self):
        # Обработка POST запросов к API
        if self.path.startswith('/api/'):
            self.handle_api_post_request()
        else:
            self.send_error(404, "File not found")
    
    def handle_api_request(self):
        """Обработка GET запросов к API"""
        try:
            parsed_path = urlparse(self.path)
            query_params = parse_qs(parsed_path.query)
            
            if self.path.startswith('/api/trees'):
                self.handle_trees_api(query_params)
            elif self.path.startswith('/api/comments'):
                self.handle_comments_api(query_params)
            else:
                # Пробуем выполнить Python скрипт
                self.handle_python_script()
                
        except Exception as e:
            self.send_error(500, f"Internal server error: {str(e)}")
    
    def handle_api_post_request(self):
        """Обработка POST запросов к API"""
        try:
            if self.path.startswith('/api/'):
                # Для POST запросов тоже пробуем выполнить Python скрипт
                self.handle_python_script()
            else:
                self.send_error(404, "API endpoint not found")
                
        except Exception as e:
            self.send_error(500, f"Internal server error: {str(e)}")
    
    def handle_python_script(self):
        """Выполнение Python скриптов"""
        try:
            # Получаем путь к скрипту
            script_path = self.path[1:]  # Убираем первый слеш
            
            if not os.path.exists(script_path):
                self.send_error(404, f"Script not found: {script_path}")
                return
            
            # Запускаем скрипт через subprocess
            import subprocess
            import sys
            
            # Устанавливаем переменные окружения для CGI
            env = os.environ.copy()
            env['REQUEST_METHOD'] = self.command
            env['CONTENT_LENGTH'] = str(int(self.headers.get('Content-Length', 0)))
            env['CONTENT_TYPE'] = self.headers.get('Content-Type', '')
            
            # Если это POST запрос, передаем данные в stdin
            if self.command == 'POST' and int(env['CONTENT_LENGTH']) > 0:
                post_data = self.rfile.read(int(env['CONTENT_LENGTH']))
                result = subprocess.run(
                    [sys.executable, script_path],
                    input=post_data,
                    capture_output=True,
                    text=False,
                    env=env
                )
            else:
                result = subprocess.run(
                    [sys.executable, script_path],
                    capture_output=True,
                    text=False,
                    env=env
                )
            
            if result.returncode == 0:
                # Отправляем вывод скрипта как ответ
                self.send_response(200)
                self.end_headers()
                self.wfile.write(result.stdout)
            else:
                self.send_error(500, f"Script error: {result.stderr.decode()}")
                
        except Exception as e:
            self.send_error(500, f"Script execution error: {str(e)}")
    
    def handle_trees_api(self, query_params):
        """Обработка запросов к деревьям через встроенный API"""
        conn = self.get_db_connection()
        
        try:
            if 'id' in query_params:
                # Запрос конкретного дерева
                tree_id = int(query_params['id'][0])
                tree = conn.execute('SELECT * FROM trees WHERE id = ?', (tree_id,)).fetchone()
                
                if tree:
                    status_history = conn.execute(
                        'SELECT * FROM tree_status WHERE tree_id = ? ORDER BY date_recorded DESC',
                        (tree_id,)
                    ).fetchall()
                    
                    comments = conn.execute(
                        '''SELECT * FROM comments 
                           WHERE tree_id = ? AND is_reviewed = 1 
                           ORDER BY created_at DESC''',
                        (tree_id,)
                    ).fetchall()
                    
                    response = {
                        'tree': dict(tree),
                        'status_history': [dict(status) for status in status_history],
                        'comments': [dict(comment) for comment in comments]
                    }
                else:
                    response = {'error': 'Tree not found'}
            else:
                # Запрос всех деревьев
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
                
                response = [dict(tree) for tree in trees]
            
            self.send_json_response(response)
            
        finally:
            conn.close()
    
    def handle_comments_api(self, query_params):
        """Обработка GET запросов к комментариям"""
        conn = self.get_db_connection()
        
        try:
            if 'tree_id' in query_params:
                tree_id = int(query_params['tree_id'][0])
                comments = conn.execute(
                    '''SELECT * FROM comments 
                       WHERE tree_id = ? AND is_reviewed = 1 
                       ORDER BY created_at DESC''',
                    (tree_id,)
                ).fetchall()
                
                response = [dict(comment) for comment in comments]
                self.send_json_response(response)
            else:
                self.send_error(400, "tree_id parameter required")
                
        finally:
            conn.close()
    
    def get_db_connection(self):
        """Создание подключения к базе данных"""
        db_path = os.path.join(os.path.dirname(__file__), 'data', 'database.db')
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        
        # Инициализация базы данных
        self.init_database(conn)
        
        return conn
    
    def init_database(self, conn):
        """Инициализация базы данных"""
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
        
        # Добавляем тестовые данные если таблицы пустые
        cursor = conn.execute('SELECT COUNT(*) as count FROM trees')
        if cursor.fetchone()[0] == 0:
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
    
    def send_json_response(self, data, status=200):
        """Отправка JSON ответа"""
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        
        response_json = json.dumps(data, ensure_ascii=False)
        self.wfile.write(response_json.encode('utf-8'))
    
    def end_headers(self):
        """Добавляем CORS заголовки"""
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

def main():
    """Запуск сервера"""
    # Создаем папки если их нет
    os.makedirs('data', exist_ok=True)
    os.makedirs('api', exist_ok=True)
    
    PORT = 8000
    
    with socketserver.TCPServer(("", PORT), DendroMonitorHTTPRequestHandler) as httpd:
        print(f"🚀 Сервер запущен на http://localhost:{PORT}")
        print("📁 Статические файлы обслуживаются из текущей директории")
        print("🔧 API доступно по адресам:")
        print("   GET /api/trees.py - список всех деревьев")
        print("   GET /api/trees.py?id=1 - информация о дереве")
        print("   POST /api/add_tree.py - добавление дерева")
        print("   GET /api/comments.py?tree_id=1 - комментарии к дереву")
        print("   POST /api/comments.py - добавление комментария")
        print("\n⏹️  Для остановки сервера нажмите Ctrl+C")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 Сервер остановлен")

if __name__ == '__main__':
    main()