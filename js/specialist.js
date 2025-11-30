// Функционал для страницы специалиста
class SpecialistPanel {
    constructor() {
        this.trees = [];
        this.init();
    }
    
    async init() {
        // Проверяем авторизацию
        if (!authManager.requireAuth()) {
            return;
        }
        
        await this.loadTrees();
        this.initMap();
        this.setupEventListeners();
        this.updateStatistics();
    }
    
    async loadTrees() {
        try {
            this.trees = await app.getTrees();
            this.renderTreesList();
        } catch (error) {
            console.error('Ошибка загрузки деревьев:', error);
        }
    }
    
    initMap() {
        // Инициализация карты (аналогично главной странице)
        this.map = L.map('map').setView([55.7558, 37.6173], 12);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);
        
        // Добавляем существующие деревья на карту
        this.trees.forEach(tree => {
            this.addTreeToMap(tree);
        });
        
        // Обработчик клика на карту для координат
        this.map.on('click', (e) => {
            document.getElementById('tree-latitude').value = e.latlng.lat.toFixed(6);
            document.getElementById('tree-longitude').value = e.latlng.lng.toFixed(6);
            showNotification('Координаты автоматически заполнены!');
        });
    }
    
    addTreeToMap(tree) {
        const statusColors = {
            'excellent': '#4caf50',
            'good': '#8bc34a',
            'satisfactory': '#ffeb3b',
            'poor': '#ff9800',
            'critical': '#f44336'
        };
        
        const marker = L.circleMarker([tree.latitude, tree.longitude], {
            radius: 8,
            fillColor: statusColors[tree.status] || '#666',
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
        }).addTo(this.map);
        
        marker.bindPopup(`
            <div class="tree-popup">
                <h4>${tree.species}</h4>
                <p><strong>Адрес:</strong> ${tree.address}</p>
                <p><strong>Состояние:</strong> ${this.getStatusText(tree.status)}</p>
                <button onclick="specialistPanel.updateTreeStatus(${tree.id})" class="btn">
                    🔄 Обновить состояние
                </button>
            </div>
        `);
    }
    
    setupEventListeners() {
        // Форма добавления дерева
        document.getElementById('show-add-form').addEventListener('click', () => {
            document.getElementById('add-tree-form').classList.remove('hidden');
        });
        
        document.getElementById('cancel-add-form').addEventListener('click', () => {
            document.getElementById('add-tree-form').classList.add('hidden');
            document.getElementById('tree-form').reset();
        });
        
        document.getElementById('tree-form').addEventListener('submit', (e) => {
            this.handleAddTree(e);
        });
        
        // Форма обновления статуса
        document.getElementById('cancel-status').addEventListener('click', () => {
            document.getElementById('status-modal').classList.add('hidden');
        });
        
        document.getElementById('status-form').addEventListener('submit', (e) => {
            this.handleUpdateStatus(e);
        });
    }
    
    async handleAddTree(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
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
        
        try {
            const result = await app.addTree(treeData);
            
            if (result.success) {
                showNotification('✅ Дерево успешно добавлено!', 'success');
                document.getElementById('tree-form').reset();
                document.getElementById('add-tree-form').classList.add('hidden');
                
                // Обновляем интерфейс
                this.trees.push(result.tree);
                this.addTreeToMap(result.tree);
                this.renderTreesList();
                this.updateStatistics();
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            showNotification('❌ Ошибка добавления дерева: ' + error.message, 'error');
        }
    }
    
    updateTreeStatus(treeId) {
        const tree = this.trees.find(t => t.id === treeId);
        if (tree) {
            document.getElementById('status-tree-id').value = treeId;
            document.getElementById('update-status').value = tree.status || 'good';
            document.getElementById('update-notes').value = '';
            document.getElementById('is-future-plan').checked = false;
            document.getElementById('status-modal').classList.remove('hidden');
        }
    }
    
    async handleUpdateStatus(e) {
        e.preventDefault();
        
        const treeId = document.getElementById('status-tree-id').value;
        const formData = new FormData(e.target);
        
        const statusData = {
            tree_id: parseInt(treeId),
            status: formData.get('status'),
            notes: formData.get('notes') || '',
            is_future_plan: formData.get('is_future_plan') === 'on'
        };
        
        try {
            const result = await app.updateTreeStatus(statusData);
            
            if (result.success) {
                showNotification('✅ Состояние дерева обновлено!', 'success');
                document.getElementById('status-modal').classList.add('hidden');
                
                // Обновляем дерево в списке
                await this.loadTrees();
                this.updateStatistics();
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            showNotification('❌ Ошибка обновления: ' + error.message, 'error');
        }
    }
    
    renderTreesList() {
        const container = document.getElementById('trees-list');
        
        if (this.trees.length === 0) {
            container.innerHTML = '<div class="loading">Нет добавленных деревьев</div>';
            return;
        }
        
        container.innerHTML = this.trees.map(tree => `
            <div class="tree-item">
                <div class="tree-info">
                    <h4>${tree.species}</h4>
                    <p class="tree-address">📍 ${tree.address}</p>
                    <p class="tree-status">Состояние: <span class="status-badge ${tree.status}">${this.getStatusText(tree.status)}</span></p>
                </div>
                <div class="tree-actions">
                    <button onclick="specialistPanel.updateTreeStatus(${tree.id})" class="action-btn update-btn">
                        🔄 Обновить
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    updateStatistics() {
        document.getElementById('total-trees').textContent = this.trees.length;
        
        const needCareCount = this.trees.filter(tree => 
            ['poor', 'critical'].includes(tree.status)
        ).length;
        
        document.getElementById('need-care').textContent = needCareCount;
        // Здесь можно добавить подсчет новых комментариев
        document.getElementById('new-comments').textContent = '0';
    }
    
    getStatusText(status) {
        const statusMap = {
            'excellent': 'Отличное',
            'good': 'Хорошее',
            'satisfactory': 'Удовлетворительное',
            'poor': 'Плохое',
            'critical': 'Критическое'
        };
        return statusMap[status] || 'Неизвестно';
    }
}

// Создаем глобальный экземпляр
const specialistPanel = new SpecialistPanel();