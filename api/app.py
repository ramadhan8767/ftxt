from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import os
from datetime import datetime
import json

app = Flask(__name__)
CORS(app)

# تهيئة قاعدة البيانات
def init_db():
    conn = sqlite3.connect('ftxt_files.db')
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS files (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            content TEXT NOT NULL,
            size TEXT NOT NULL,
            date TEXT NOT NULL,
            words INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()

# مسارات API
@app.route('/api/files', methods=['GET'])
def get_files():
    try:
        conn = sqlite3.connect('ftxt_files.db')
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, name, content, size, date, words 
            FROM files 
            ORDER BY created_at DESC
        ''')
        
        files = []
        for row in cursor.fetchall():
            files.append({
                'id': row[0],
                'name': row[1],
                'content': row[2],
                'size': row[3],
                'date': row[4],
                'words': row[5]
            })
        
        conn.close()
        return jsonify({'files': files})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/files', methods=['POST'])
def create_file():
    try:
        data = request.get_json()
        
        if not data or 'name' not in data or 'content' not in data:
            return jsonify({'error': 'بيانات غير مكتملة'}), 400
        
        file_id = data.get('id')
        name = data['name']
        content = data['content']
        size = data.get('size', '0 ك.ب')
        date = data.get('date', datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
        words = data.get('words', 0)
        
        conn = sqlite3.connect('ftxt_files.db')
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO files (id, name, content, size, date, words)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (file_id, name, content, size, date, words))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'id': file_id,
            'name': name,
            'content': content,
            'size': size,
            'date': date,
            'words': words
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/files/<file_id>', methods=['PUT'])
def update_file(file_id):
    try:
        data = request.get_json()
        
        if not data or 'name' not in data:
            return jsonify({'error': 'بيانات غير مكتملة'}), 400
        
        new_name = data['name']
        
        conn = sqlite3.connect('ftxt_files.db')
        cursor = conn.cursor()
        
        cursor.execute('''
            UPDATE files 
            SET name = ? 
            WHERE id = ?
        ''', (new_name, file_id))
        
        if cursor.rowcount == 0:
            conn.close()
            return jsonify({'error': 'الملف غير موجود'}), 404
        
        conn.commit()
        conn.close()
        
        return jsonify({'success': True})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/files/<file_id>', methods=['DELETE'])
def delete_file(file_id):
    try:
        conn = sqlite3.connect('ftxt_files.db')
        cursor = conn.cursor()
        
        cursor.execute('DELETE FROM files WHERE id = ?', (file_id,))
        
        if cursor.rowcount == 0:
            conn.close()
            return jsonify({'error': 'الملف غير موجود'}), 404
        
        conn.commit()
        conn.close()
        
        return jsonify({'success': True})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        
        if not data or 'username' not in data or 'password' not in data:
            return jsonify({'error': 'بيانات تسجيل الدخول غير مكتملة'}), 400
        
        # في التطبيق الحقيقي، يجب التحقق من كلمة المرور بشكل آمن
        # هذا مثال مبسط فقط
        username = data['username']
        password = data['password']
        
        conn = sqlite3.connect('ftxt_files.db')
        cursor = conn.cursor()
        
        cursor.execute('SELECT id, username FROM users WHERE username = ? AND password_hash = ?', 
                      (username, password))  # في التطبيق الحقيقي، استخدم hashing
        
        user = cursor.fetchone()
        conn.close()
        
        if user:
            return jsonify({
                'id': user[0],
                'username': user[1],
                'message': 'تم تسجيل الدخول بنجاح'
            })
        else:
            return jsonify({'error': 'اسم المستخدم أو كلمة المرور غير صحيحة'}), 401
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    init_db()
    app.run(debug=True, host='0.0.0.0', port=5000)