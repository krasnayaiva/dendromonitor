// Основные функции приложения
class DendroMonitor {
    constructor() {
        this.apiBase = '/.netlify/functions';
    }
    
    async addTree(treeData) {
        try {
            const response = await fetch(`${this.apiBase}/add-tree`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(treeData)
            });
            return await response.json();
        } catch (error) {
            console.error('Ошибка добавления дерева:', error);
            return { success: false, error: 'Ошибка соединения' };
        }
    }
    
    async getTree(id) {
        try {
            const response = await fetch(`${this.apiBase}/trees?id=${id}`);
            return await response.json();
        } catch (error) {
            console.error('Ошибка получения дерева:', error);
            return null;
        }
    }
    
    async getTrees() {
        try {
            const response = await fetch(`${this.apiBase}/trees`);
            return await response.json();
        } catch (error) {
            console.error('Ошибка получения деревьев:', error);
            return [];
        }
    }

    async submitComment(treeId, commentData) {
        try {
            const response = await fetch(`${this.apiBase}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    tree_id: treeId,
                    ...commentData
                })
            });
            return await response.json();
        } catch (error) {
            console.error('Ошибка отправки комментария:', error);
            return { success: false, error: 'Ошибка соединения' };
        }
    }
}

// Создаем экземпляр приложения
const app = new DendroMonitor();

// Утилиты
function showNotification(message, type = 'success') {
    // Создаем уведомление
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'success' ? '#4caf50' : '#f44336'};
        color: white;
        border-radius: 6px;
        z-index: 1000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    `;
    
    document.body.appendChild(notification);
    
    // Удаляем через 5 секунд
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

class AuthManager {
    constructor() {
        this.isAuthenticated = this.checkAuth();
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.updateUI();
    }
    
    checkAuth() {
        return localStorage.getItem('specialist_auth') === 'true';
    }
    
    setupEventListeners() {
        const loginBtn = document.getElementById('login-btn');
        const logoutBtn = document.getElementById('logout-btn');
        
        if (loginBtn) {
            loginBtn.addEventListener('click', () => this.showLoginModal());
        }
        
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }
        
        // Обработчик формы добавления дерева
        const treeForm = document.getElementById('tree-form');
        const cancelBtn = document.getElementById('cancel-add-form');
        
        if (treeForm) {
            treeForm.addEventListener('submit', (e) => this.handleAddTree(e));
        }
        
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                document.getElementById('tree-form').reset();
            });
        }
    }
    
    updateUI() {
        const loginBtn = document.getElementById('login-btn');
        const userInfo = document.getElementById('user-info');
        const addTreeSection = document.getElementById('add-tree-section');
        
        console.log('Update UI called. Authenticated:', this.isAuthenticated);
        console.log('Elements found - loginBtn:', !!loginBtn, 'userInfo:', !!userInfo, 'addTreeSection:', !!addTreeSection);
        
        if (loginBtn && userInfo) {
            if (this.isAuthenticated) {
                loginBtn.classList.add('hidden');
                userInfo.classList.remove('hidden');
                // ПОКАЗЫВАЕМ секцию добавления дерева
                if (addTreeSection) {
                    addTreeSection.classList.remove('hidden');
                    console.log('Showing add tree section');
                } else {
                    console.log('Add tree section not found!');
                }
            } else {
                loginBtn.classList.remove('hidden');
                userInfo.classList.add('hidden');
                // СКРЫВАЕМ секцию добавления дерева
                if (addTreeSection) {
                    addTreeSection.classList.add('hidden');
                    console.log('Hiding add tree section');
                }
            }
        } else {
            console.log('Login button or user info not found');
        }
    }
    
    showLoginModal() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>🔐 Вход для специалистов</h3>
                <input type="password" id="password-input" class="password-input" placeholder="Введите пароль">
                <div class="modal-actions">
                    <button id="confirm-login" class="modal-btn primary">Войти</button>
                    <button id="cancel-login" class="modal-btn secondary">Отмена</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Обработчики событий для модального окна
        document.getElementById('confirm-login').addEventListener('click', () => {
            this.login(modal);
        });
        
        document.getElementById('cancel-login').addEventListener('click', () => {
            modal.remove();
        });
        
        // Enter для ввода пароля
        document.getElementById('password-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.login(modal);
            }
        });
        
        // Фокус на поле ввода
        document.getElementById('password-input').focus();
    }
    
    login(modal) {
        const password = document.getElementById('password-input').value;
        
        if (password === 'admin123') {
            this.isAuthenticated = true;
            localStorage.setItem('specialist_auth', 'true');
            modal.remove();
            showNotification('✅ Успешный вход! Теперь вы можете добавлять деревья.', 'success');
            
            // Обновляем интерфейс
            this.updateUI();
            
            // Настраиваем обработчик клика на карту для координат
            this.setupMapClickHandler();
            
        } else {
            showNotification('❌ Неверный пароль!', 'error');
            document.getElementById('password-input').value = '';
            document.getElementById('password-input').focus();
        }
    }

    setupMapClickHandler() {
        // Ждем немного чтобы карта точно была готова
        setTimeout(() => {
            if (window.setupMapClickHandler) {
                window.setupMapClickHandler();
                console.log('Обработчик клика на карту активирован');
            } else {
                console.log('Функция setupMapClickHandler не найдена');
            }
        }, 500);
    }
    
    logout() {
        this.isAuthenticated = false;
        localStorage.removeItem('specialist_auth');
        showNotification('👋 Вы вышли из системы', 'success');
        
        // Обновляем интерфейс
        this.updateUI();
    }
    
    setupMapClickHandler() {
        if (window.map && this.isAuthenticated) {
            window.map.on('click', (e) => {
                const latInput = document.getElementById('tree-latitude');
                const lngInput = document.getElementById('tree-longitude');
                
                if (latInput && lngInput) {
                    latInput.value = e.latlng.lat.toFixed(6);
                    lngInput.value = e.latlng.lng.toFixed(6);
                    showNotification('Координаты автоматически заполнены!', 'success');
                }
            });
        }
    }
    
    async handleAddTree(e) {
        e.preventDefault();
        
        if (!this.isAuthenticated) {
            showNotification('❌ Для добавления деревьев требуется авторизация', 'error');
            return;
        }
        
        const formData = new FormData(e.target);
        const submitBtn = e.target.querySelector('.submit-btn');
        
        const treeData = {
            species: formData.get('species'),
            address: formData.get('address'),
            latitude: parseFloat(formData.get('latitude')),
            longitude: parseFloat(formData.get('longitude')),
            diameter: formData.get('diameter') ? parseFloat(formData.get('diameter')) : null,
            height: formData.get('height') ? parseFloat(formData.get('height')) : null,
            status: formData.get('status'),
            notes: formData.get('notes') || ''
        };
        
        // Валидация
        if (!treeData.species || !treeData.address || !treeData.latitude || !treeData.longitude) {
            showNotification('❌ Заполните все обязательные поля', 'error');
            return;
        }
        
        // Блокируем кнопку
        submitBtn.disabled = true;
        submitBtn.textContent = 'Добавление...';
        
        try {
            const result = await app.addTree(treeData);
            
            if (result.success) {
                showNotification('✅ Дерево успешно добавлено!', 'success');
                e.target.reset();
                
                // Добавляем дерево на карту
                if (window.addTreeToMap && result.tree) {
                    window.addTreeToMap(result.tree);
                }
                
                // Обновляем статистику
                if (window.loadTrees) {
                    window.loadTrees();
                }
            } else {
                throw new Error(result.error || 'Ошибка добавления');
            }
            
        } catch (error) {
            console.error('Ошибка добавления дерева:', error);
            showNotification('❌ Ошибка добавления дерева: ' + error.message, 'error');
        } finally {
            // Разблокируем кнопку
            submitBtn.disabled = false;
            submitBtn.textContent = '✅ Добавить дерево';
        }
    }
}

// Создаем глобальный экземпляр
const authManager = new AuthManager();

// Добавляем метод проверки авторизации в основной класс
DendroMonitor.prototype.requireAuth = function() {
    return authManager.requireAuth();
};

// Обработчик формы добавления дерева
document.addEventListener('DOMContentLoaded', function() {
    const treeForm = document.getElementById('tree-form');
    const cancelBtn = document.getElementById('cancel-add-form');
    
    if (treeForm) {
        treeForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleAddTree(e);
        });
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            document.getElementById('tree-form').reset();
        });
    }
    
    // Обработчик клика на карту для координат
    if (window.map) {
        window.map.on('click', function(e) {
            if (authManager.isAuthenticated) {
                document.getElementById('tree-latitude').value = e.latlng.lat.toFixed(6);
                document.getElementById('tree-longitude').value = e.latlng.lng.toFixed(6);
                showNotification('Координаты автоматически заполнены!', 'success');
            }
        });
    }
});

async function handleAddTree(e) {
    if (!authManager.isAuthenticated) {
        showNotification('❌ Для добавления деревьев требуется авторизация', 'error');
        return;
    }
    
    const formData = new FormData(e.target);
    const submitBtn = e.target.querySelector('.submit-btn');
    
    const treeData = {
        species: formData.get('species'),
        address: formData.get('address'),
        latitude: parseFloat(formData.get('latitude')),
        longitude: parseFloat(formData.get('longitude')),
        diameter: formData.get('diameter') ? parseFloat(formData.get('diameter')) : null,
        height: formData.get('height') ? parseFloat(formData.get('height')) : null,
        status: formData.get('status'),
        notes: formData.get('notes') || ''
    };
    
    // Блокируем кнопку
    submitBtn.disabled = true;
    submitBtn.textContent = 'Добавление...';
    
    try {
        const result = await app.addTree(treeData);
        
        if (result.success) {
            showNotification('✅ Дерево успешно добавлено!', 'success');
            e.target.reset();
            
            // Добавляем дерево на карту
            if (window.addTreeToMap) {
                window.addTreeToMap(result.tree);
            }
            
            // Обновляем статистику
            if (window.loadTrees) {
                window.loadTrees();
            }
        } else {
            throw new Error(result.error || 'Ошибка добавления');
        }
        
    } catch (error) {
        console.error('Ошибка добавления дерева:', error);
        showNotification('❌ Ошибка добавления дерева: ' + error.message, 'error');
    } finally {
        // Разблокируем кнопку
        submitBtn.disabled = false;
        submitBtn.textContent = '✅ Добавить дерево';
    }
}

DendroMonitor.prototype.addTree = async function(treeData) {
    try {
        const response = await fetch('/api/add_tree', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(treeData)
        });
        return await response.json();
    } catch (error) {
        console.error('Ошибка добавления дерева:', error);
        return { success: false, error: 'Ошибка соединения: ' + error.message };
    }
};

// Добавьте в конец файла js/app.js
console.log('app.js загружен');

// Проверяем элементы на странице
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM загружен, проверяем элементы:');
    console.log('map элемент:', document.getElementById('map'));
    console.log('authManager:', window.authManager);
    console.log('map объект:', window.map);
    
    // Проверяем авторизацию при загрузке
    if (window.authManager && window.authManager.isAuthenticated) {
        console.log('Пользователь уже авторизован, настраиваем обработчик кликов');
        setTimeout(() => {
            if (window.setupMapClickHandler) {
                window.setupMapClickHandler();
            }
        }, 1000);
    }
});