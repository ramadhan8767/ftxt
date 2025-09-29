// API base URL - استبدل هذا بالرابط الفعلي لاستضافتك
const API_BASE_URL = 'https://yourdomain.com/api';

// العناصر الرئيسية
const textEditor = document.getElementById('textEditor');
const saveBtn = document.getElementById('saveBtn');
const clearBtn = document.getElementById('clearBtn');
const charCount = document.getElementById('charCount');
const wordCount = document.getElementById('wordCount');
const sizeCount = document.getElementById('sizeCount');
const filesList = document.getElementById('filesList');
const filesCount = document.getElementById('filesCount');

// النوافذ المنبثقة
const developerModal = document.getElementById('developerModal');
const loginModal = document.getElementById('loginModal');
const renameModal = document.getElementById('renameModal');

// أزرار النوافذ
const developerBtn = document.getElementById('developerBtn');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const closeDeveloperModal = document.getElementById('closeDeveloperModal');
const closeLoginModal = document.getElementById('closeLoginModal');
const closeRenameModal = document.getElementById('closeRenameModal');
const cancelLogin = document.getElementById('cancelLogin');
const cancelRename = document.getElementById('cancelRename');

// النماذج
const loginForm = document.getElementById('loginForm');
const renameForm = document.getElementById('renameForm');

// معلومات المستخدم
const userInfo = document.getElementById('userInfo');
const userName = document.getElementById('userName');
const userAvatar = document.getElementById('userAvatar');

// المتغيرات العامة
const MAX_FILE_SIZE_MB = 30;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
let savedFiles = [];
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let fileToRenameId = null;

// API Functions
async function apiCall(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
}

async function loadFiles() {
    try {
        const data = await apiCall('/files');
        savedFiles = data.files || [];
        displayFiles();
    } catch (error) {
        console.error('Failed to load files:', error);
        // Fallback to localStorage if API fails
        savedFiles = JSON.parse(localStorage.getItem('ftxtFiles')) || [];
        displayFiles();
    }
}

async function saveFileToAPI(fileData) {
    try {
        const data = await apiCall('/files', {
            method: 'POST',
            body: JSON.stringify(fileData)
        });
        return data;
    } catch (error) {
        console.error('Failed to save file to API:', error);
        // Fallback to localStorage
        const files = JSON.parse(localStorage.getItem('ftxtFiles')) || [];
        files.unshift(fileData);
        localStorage.setItem('ftxtFiles', JSON.stringify(files));
        return fileData;
    }
}

async function updateFileInAPI(fileId, newName) {
    try {
        const data = await apiCall(`/files/${fileId}`, {
            method: 'PUT',
            body: JSON.stringify({ name: newName })
        });
        return data;
    } catch (error) {
        console.error('Failed to update file:', error);
        // Fallback to localStorage
        const files = JSON.parse(localStorage.getItem('ftxtFiles')) || [];
        const fileIndex = files.findIndex(f => f.id === fileId);
        if (fileIndex !== -1) {
            files[fileIndex].name = newName;
            localStorage.setItem('ftxtFiles', JSON.stringify(files));
        }
        return { success: true };
    }
}

async function deleteFileFromAPI(fileId) {
    try {
        await apiCall(`/files/${fileId}`, {
            method: 'DELETE'
        });
        return true;
    } catch (error) {
        console.error('Failed to delete file:', error);
        // Fallback to localStorage
        const files = JSON.parse(localStorage.getItem('ftxtFiles')) || [];
        const updatedFiles = files.filter(f => f.id !== fileId);
        localStorage.setItem('ftxtFiles', JSON.stringify(updatedFiles));
        return true;
    }
}

// تهيئة التطبيق
function initApp() {
    // تعيين السنة الحالية
    document.getElementById('year').textContent = new Date().getFullYear();
    
    updateStats();
    loadFiles();
    checkUserLogin();
    
    // تحميل النص المحفوظ مؤقتاً
    if (localStorage.getItem('savedText')) {
        textEditor.value = localStorage.getItem('savedText');
        updateStats();
    }
    
    // الحفظ التلقائي للنص كل 5 ثوانٍ
    setInterval(() => {
        if (textEditor.value.trim()) {
            localStorage.setItem('savedText', textEditor.value);
        }
    }, 5000);
    
    textEditor.focus();
    
    // إضافة مستمعي الأحداث
    setupEventListeners();
}

// إعداد مستمعي الأحداث
function setupEventListeners() {
    textEditor.addEventListener('input', updateStats);
    saveBtn.addEventListener('click', saveFile);
    clearBtn.addEventListener('click', clearContent);
    
    // نوافذ منبثقة
    developerBtn.addEventListener('click', () => {
        developerModal.style.display = 'flex';
    });
    
    closeDeveloperModal.addEventListener('click', () => {
        developerModal.style.display = 'none';
    });
    
    loginBtn.addEventListener('click', () => {
        loginModal.style.display = 'flex';
    });
    
    closeLoginModal.addEventListener('click', () => {
        loginModal.style.display = 'none';
    });
    
    cancelLogin.addEventListener('click', () => {
        loginModal.style.display = 'none';
    });
    
    closeRenameModal.addEventListener('click', () => {
        renameModal.style.display = 'none';
    });
    
    cancelRename.addEventListener('click', () => {
        renameModal.style.display = 'none';
    });
    
    // تسجيل الدخول
    loginForm.addEventListener('submit', handleLogin);
    
    // تسجيل الخروج
    logoutBtn.addEventListener('click', handleLogout);
    
    // إعادة تسمية الملف
    renameForm.addEventListener('submit', handleRename);
    
    // إغلاق النوافذ عند النقر خارجها
    window.addEventListener('click', (e) => {
        if (e.target === developerModal) developerModal.style.display = 'none';
        if (e.target === loginModal) loginModal.style.display = 'none';
        if (e.target === renameModal) renameModal.style.display = 'none';
    });
}

// التحقق من حالة تسجيل الدخول
function checkUserLogin() {
    if (currentUser) {
        userInfo.style.display = 'flex';
        userName.textContent = currentUser.username;
        userAvatar.textContent = currentUser.username.charAt(0).toUpperCase();
        loginBtn.style.display = 'none';
    } else {
        userInfo.style.display = 'none';
        loginBtn.style.display = 'flex';
    }
}

// حساب حجم الملف
function calculateFileSize(content) {
    const sizeInBytes = new Blob([content]).size;
    const sizeInKB = (sizeInBytes / 1024).toFixed(2);
    const sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(2);
    
    if (sizeInBytes >= 1024 * 1024) {
        return sizeInMB + ' م.ب';
    } else {
        return sizeInKB + ' ك.ب';
    }
}

// تحديث الإحصائيات
function updateStats() {
    const text = textEditor.value;
    const chars = text.length;
    const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
    const size = calculateFileSize(text);
    
    charCount.textContent = `${chars} أحرف`;
    wordCount.textContent = `${words} كلمات`;
    sizeCount.textContent = size;
    
    // التحقق من تجاوز الحد الأقصى
    const currentSize = new Blob([text]).size;
    if (currentSize > MAX_FILE_SIZE_BYTES) {
        sizeCount.classList.add('size-warning');
        saveBtn.disabled = true;
        saveBtn.classList.add('action-btn-warning');
        saveBtn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> <span>الحجم كبير جداً</span>';
    } else {
        sizeCount.classList.remove('size-warning');
        saveBtn.disabled = false;
        saveBtn.classList.remove('action-btn-warning');
        saveBtn.innerHTML = '<i class="fas fa-save"></i> <span>حفظ الملف</span>';
    }
}

// عرض الملفات
function displayFiles() {
    if (savedFiles.length === 0) {
        filesList.innerHTML = '<div class="empty-files">لا توجد ملفات محفوظة بعد</div>';
        filesCount.textContent = '0 ملفات';
        return;
    }
    
    filesCount.textContent = `${savedFiles.length} ملفات`;
    
    filesList.innerHTML = savedFiles.map(file => `
        <div class="file-item">
            <div class="file-info">
                <i class="fas fa-file-alt file-icon"></i>
                <div class="file-details">
                    <div class="file-name">${file.name}</div>
                    <div class="file-meta">
                        <span class="file-size">${file.size}</span>
                        <span class="file-date">${file.date}</span>
                        <span class="file-words">${file.words} كلمات</span>
                    </div>
                </div>
            </div>
            <div class="file-actions">
                <button class="file-btn view-btn" onclick="viewFile('${file.id}')" title="عرض الملف">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="file-btn rename-btn" onclick="openRenameModal('${file.id}')" title="إعادة تسمية">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="file-btn download-btn" onclick="downloadFile('${file.id}')" title="تحميل الملف">
                    <i class="fas fa-download"></i>
                </button>
                <button class="file-btn delete-btn" onclick="deleteFile('${file.id}')" title="حذف الملف">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// حفظ الملف
async function saveFile() {
    const content = textEditor.value.trim();
    
    if (!content) {
        alert('يرجى إدخال نص لحفظه!');
        textEditor.focus();
        return;
    }
    
    const currentSize = new Blob([content]).size;
    if (currentSize > MAX_FILE_SIZE_BYTES) {
        alert(`حجم الملف كبير جداً! الحد الأقصى المسموح به هو ${MAX_FILE_SIZE_MB} ميجابايت.`);
        return;
    }
    
    const fileName = prompt('أدخل اسم الملف:', `ملف_${new Date().toLocaleDateString('ar-EG')}`);
    
    if (!fileName) return;
    
    const fileData = {
        id: generateId(),
        name: fileName.endsWith('.ftxt') ? fileName : fileName + '.ftxt',
        content: content,
        size: calculateFileSize(content),
        date: new Date().toLocaleString('ar-EG'),
        words: content.trim() === '' ? 0 : content.trim().split(/\s+/).length
    };
    
    try {
        await saveFileToAPI(fileData);
        savedFiles.unshift(fileData);
        displayFiles();
        
        // حفظ في localStorage كنسخة احتياطية
        const files = JSON.parse(localStorage.getItem('ftxtFiles')) || [];
        files.unshift(fileData);
        localStorage.setItem('ftxtFiles', JSON.stringify(files));
        
        alert('تم حفظ الملف بنجاح!');
    } catch (error) {
        alert('حدث خطأ أثناء حفظ الملف. تم الحفظ محلياً فقط.');
    }
}

// مسح المحتوى
function clearContent() {
    if (textEditor.value.trim() && !confirm('هل أنت متأكد من مسح المحتوى؟')) {
        return;
    }
    
    textEditor.value = '';
    localStorage.removeItem('savedText');
    updateStats();
    textEditor.focus();
}

// عرض الملف
function viewFile(fileId) {
    const file = savedFiles.find(f => f.id === fileId);
    if (file) {
        textEditor.value = file.content;
        updateStats();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// تحميل الملف
function downloadFile(fileId) {
    const file = savedFiles.find(f => f.id === fileId);
    if (file) {
        const blob = new Blob([file.content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// حذف الملف
async function deleteFile(fileId) {
    if (!confirm('هل أنت متأكد من حذف هذا الملف؟')) {
        return;
    }
    
    try {
        await deleteFileFromAPI(fileId);
        savedFiles = savedFiles.filter(f => f.id !== fileId);
        displayFiles();
        
        // تحديث localStorage
        const files = JSON.parse(localStorage.getItem('ftxtFiles')) || [];
        const updatedFiles = files.filter(f => f.id !== fileId);
        localStorage.setItem('ftxtFiles', JSON.stringify(updatedFiles));
    } catch (error) {
        alert('حدث خطأ أثناء حذف الملف.');
    }
}

// فتح نافذة إعادة التسمية
function openRenameModal(fileId) {
    const file = savedFiles.find(f => f.id === fileId);
    if (file) {
        fileToRenameId = fileId;
        const fileNameWithoutExt = file.name.replace('.ftxt', '');
        document.getElementById('newFileName').value = fileNameWithoutExt;
        renameModal.style.display = 'flex';
    }
}

// معالجة إعادة التسمية
async function handleRename(e) {
    e.preventDefault();
    
    if (!fileToRenameId) return;
    
    const newFileName = document.getElementById('newFileName').value.trim();
    if (!newFileName) {
        alert('يرجى إدخال اسم جديد للملف!');
        return;
    }
    
    const finalFileName = newFileName.endsWith('.ftxt') ? newFileName : newFileName + '.ftxt';
    
    try {
        await updateFileInAPI(fileToRenameId, finalFileName);
        
        // تحديث الواجهة
        const fileIndex = savedFiles.findIndex(f => f.id === fileToRenameId);
        if (fileIndex !== -1) {
            savedFiles[fileIndex].name = finalFileName;
        }
        
        // تحديث localStorage
        const files = JSON.parse(localStorage.getItem('ftxtFiles')) || [];
        const localFileIndex = files.findIndex(f => f.id === fileToRenameId);
        if (localFileIndex !== -1) {
            files[localFileIndex].name = finalFileName;
            localStorage.setItem('ftxtFiles', JSON.stringify(files));
        }
        
        displayFiles();
        renameModal.style.display = 'none';
        alert('تم إعادة تسمية الملف بنجاح!');
    } catch (error) {
        alert('حدث خطأ أثناء إعادة تسمية الملف.');
    }
}

// تسجيل الدخول
function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    
    if (!username || !password) {
        alert('يرجى إدخال اسم المستخدم وكلمة المرور!');
        return;
    }
    
    // محاكاة تسجيل الدخول (في التطبيق الحقيقي، سيتم التواصل مع الخادم)
    currentUser = {
        id: generateId(),
        username: username,
        loginTime: new Date().toISOString()
    };
    
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    checkUserLogin();
    loginModal.style.display = 'none';
    loginForm.reset();
    
    alert(`مرحباً ${username}! تم تسجيل الدخول بنجاح.`);
}

// تسجيل الخروج
function handleLogout() {
    if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
        currentUser = null;
        localStorage.removeItem('currentUser');
        checkUserLogin();
        alert('تم تسجيل الخروج بنجاح.');
    }
}

// توليد معرف فريد
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// تهيئة التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', initApp);