import sqlite3
import os

def init_database():
    """تهيئة قاعدة البيانات وإنشاء الجداول"""
    
    # التأكد من وجود مجلد api
    if not os.path.exists('api'):
        os.makedirs('api')
    
    conn = sqlite3.connect('api/ftxt_files.db')
    cursor = conn.cursor()
    
    # جدول الملفات
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
    
    # جدول المستخدمين
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # إضافة مستخدم افتراضي (للتجربة)
    try:
        cursor.execute('''
            INSERT OR IGNORE INTO users (id, username, password_hash)
            VALUES (?, ?, ?)
        ''', ('user1', 'admin', 'password123'))  # في التطبيق الحقيقي، استخدم كلمات مرور مشفرة
    except:
        pass
    
    conn.commit()
    conn.close()
    print("✅ تم تهيئة قاعدة البيانات بنجاح!")

if __name__ == '__main__':
    init_database()