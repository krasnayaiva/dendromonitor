// Функции для страницы детализации дерева
class TreeDetail {
    constructor() {
        this.treeId = this.getTreeIdFromUrl();
        this.treeData = null;
        this.init();
    }
    
    // Получение ID дерева из URL
    getTreeIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id') || 1;
    }
    
    // Инициализация страницы
    async init() {
        if (!this.treeId) {
            this.showError('ID дерева не указан');
            return;
        }
        
        await this.loadTreeData();
        this.renderTreeInfo();
        this.renderStatusHistory();
        this.renderChart();
        this.loadComments();
        this.setupEventListeners();
    }
    
    // Загрузка данных о дереве
    async loadTreeData() {
        try {
            this.treeData = await app.getTree(this.treeId);
            
            if (!this.treeData || !this.treeData.tree) {
                throw new Error('Дерево не найдено');
            }
            
        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
            this.showError('Не удалось загрузить информацию о дереве');
            // Используем тестовые данные
            this.treeData = this.getSampleTreeData();
        }
    }
    
    // Отображение информации о дереве
    renderTreeInfo() {
        const tree = this.treeData.tree;
        
        // Обновляем заголовки
        document.getElementById('tree-name').textContent = tree.species;
        document.getElementById('tree-species').textContent = tree.species;
        
        // Статус
        const statusBadge = document.getElementById('status-badge');
        const currentStatus = this.getCurrentStatus();
        statusBadge.textContent = this.getStatusText(currentStatus);
        statusBadge.className = `status-badge ${currentStatus}`;
        
        // Детали
        document.getElementById('tree-address').textContent = tree.address || 'Не указан';
        document.getElementById('tree-diameter').textContent = tree.diameter ? `${tree.diameter} см` : 'Не измерен';
        document.getElementById('tree-height').textContent = tree.height ? `${tree.height} м` : 'Не измерена';
        document.getElementById('tree-coordinates').textContent = 
            `${tree.latitude?.toFixed(4) || '0'}, ${tree.longitude?.toFixed(4) || '0'}`;
    }
    
    // Отображение истории статусов
    renderStatusHistory() {
        const container = document.getElementById('status-history-list');
        const statusHistory = this.treeData.status_history || [];
        
        if (statusHistory.length === 0) {
            container.innerHTML = '<div class="loading">Нет записей о состоянии</div>';
            return;
        }
        
        container.innerHTML = statusHistory.map(status => `
            <div class="status-item ${status.is_future_plan ? 'future-plan' : ''}">
                <div class="status-header">
                    <span class="status-date">${this.formatDate(status.date_recorded)}</span>
                    ${status.is_future_plan ? 
                        '<span class="status-type plan">📅 План</span>' : 
                        ''}
                </div>
                <div class="status-value">
                    <strong>Состояние:</strong> ${this.getStatusText(status.status)}
                </div>
                ${status.notes ? `
                    <div class="status-notes">
                        <strong>Заметки:</strong> ${status.notes}
                    </div>
                ` : ''}
            </div>
        `).join('');
    }
    
    // Создание графика
    renderChart() {
        const ctx = document.getElementById('statusChart').getContext('2d');
        const statusHistory = this.treeData.status_history || [];
        
        if (statusHistory.length === 0) {
            document.querySelector('.chart-container').innerHTML = 
                '<div class="loading">Недостаточно данных для построения графика</div>';
            return;
        }
        
        const statusValues = {
            'excellent': 5,
            'good': 4,
            'satisfactory': 3,
            'poor': 2,
            'critical': 1
        };
        
        const labels = statusHistory.map(status => this.formatDate(status.date_recorded));
        const data = statusHistory.map(status => statusValues[status.status] || 0);
        const backgroundColors = statusHistory.map(status => 
            status.is_future_plan ? '#2196f3' : this.getStatusColor(status.status)
        );
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Состояние дерева',
                    data: data,
                    borderColor: '#4caf50',
                    backgroundColor: backgroundColors,
                    borderWidth: 2,
                    tension: 0.4,
                    pointBackgroundColor: backgroundColors,
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        min: 0,
                        max: 5,
                        ticks: {
                            callback: function(value) {
                                const statusMap = {
                                    5: 'Отличное',
                                    4: 'Хорошее',
                                    3: 'Удовлетворительное',
                                    2: 'Плохое',
                                    1: 'Критическое'
                                };
                                return statusMap[value] || '';
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.parsed.y;
                                const statusMap = {
                                    5: 'Отличное',
                                    4: 'Хорошее',
                                    3: 'Удовлетворительное',
                                    2: 'Плохое',
                                    1: 'Критическое'
                                };
                                return `Состояние: ${statusMap[value]}`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    // Загрузка комментариев
    async loadComments() {
        const container = document.getElementById('comments-list');
        
        try {
            const comments = await app.getComments(this.treeId);
            
            if (comments.length === 0) {
                container.innerHTML = '<div class="loading">Пока нет сообщений от жителей</div>';
                return;
            }
            
            container.innerHTML = comments.map(comment => `
                <div class="comment-item">
                    <div class="comment-header">
                        <span class="comment-author">${comment.user_name || 'Аноним'}</span>
                        <span class="comment-date">${this.formatDateTime(comment.created_at)}</span>
                    </div>
                    <div class="comment-text">${comment.text}</div>
                    ${comment.contact_email ? `
                        <div class="comment-contact">📧 ${comment.contact_email}</div>
                    ` : ''}
                </div>
            `).join('');
            
        } catch (error) {
            console.error('Ошибка загрузки комментариев:', error);
            container.innerHTML = '<div class="loading">Ошибка загрузки комментариев</div>';
        }
    }
    
    // Настройка обработчиков событий
    setupEventListeners() {
        const form = document.getElementById('comment-form');
        form.addEventListener('submit', (e) => this.handleCommentSubmit(e));
    }
    
    // Обработка отправки комментария
    async handleCommentSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const submitBtn = form.querySelector('.submit-btn');
        const formData = new FormData(form);
        
        const commentData = {
            user_name: formData.get('user_name') || '',
            text: formData.get('text'),
            contact_email: formData.get('contact_email') || ''
        };
        
        if (!commentData.text.trim()) {
            alert('Пожалуйста, напишите ваше сообщение');
            return;
        }
        
        // Блокируем кнопку
        submitBtn.disabled = true;
        submitBtn.textContent = 'Отправка...';
        
        try {
            const result = await app.submitComment(this.treeId, commentData);
            
            if (result.success) {
                showNotification('Ваше сообщение успешно отправлено!', 'success');
                form.reset();
                this.loadComments(); // Перезагружаем комментарии
            } else {
                throw new Error(result.error || 'Ошибка отправки');
            }
            
        } catch (error) {
            console.error('Ошибка отправки комментария:', error);
            showNotification('Ошибка отправки сообщения. Попробуйте еще раз.', 'error');
        } finally {
            // Разблокируем кнопку
            submitBtn.disabled = false;
            submitBtn.textContent = '📤 Отправить сообщение';
        }
    }
    
    // Вспомогательные методы
    getCurrentStatus() {
        const statusHistory = this.treeData.status_history || [];
        if (statusHistory.length === 0) return 'unknown';
        
        // Находим последний статус (не план)
        const currentStatus = statusHistory.find(status => !status.is_future_plan);
        return currentStatus ? currentStatus.status : statusHistory[0].status;
    }
    
    getStatusText(status) {
        const statusMap = {
            'excellent': 'Отличное',
            'good': 'Хорошее',
            'satisfactory': 'Удовлетворительное',
            'poor': 'Плохое',
            'critical': 'Критическое',
            'unknown': 'Неизвестно'
        };
        return statusMap[status] || 'Неизвестно';
    }
    
    getStatusColor(status) {
        const colorMap = {
            'excellent': '#4caf50',
            'good': '#8bc34a',
            'satisfactory': '#ff9800',
            'poor': '#ff5722',
            'critical': '#f44336'
        };
        return colorMap[status] || '#666';
    }
    
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU');
    }
    
    formatDateTime(dateTimeString) {
        const date = new Date(dateTimeString);
        return date.toLocaleString('ru-RU');
    }
    
    showError(message) {
        document.querySelector('.main').innerHTML = `
            <div class="container">
                <div style="text-align: center; padding: 4rem 2rem; color: #666;">
                    <h2>😔 Ошибка</h2>
                    <p>${message}</p>
                    <a href="index.html" class="btn" style="display: inline-block; margin-top: 1rem;">
                        Вернуться на главную
                    </a>
                </div>
            </div>
        `;
    }
    
    // Тестовые данные для демонстрации
    getSampleTreeData() {
        return {
            tree: {
                id: this.treeId,
                species: 'Дуб',
                address: 'Примерный адрес расположения',
                latitude: 55.7558,
                longitude: 37.6176,
                diameter: 85,
                height: 25
            },
            status_history: [
                {
                    date_recorded: '2024-01-15',
                    status: 'excellent',
                    notes: 'Дерево в отличном состоянии, признаков болезней нет',
                    is_future_plan: false
                },
                {
                    date_recorded: '2024-03-01',
                    status: 'good',
                    notes: 'Запланировать подкормку на весну',
                    is_future_plan: true
                }
            ]
        };
    }
}

// Добавляем метод получения комментариев в основной класс
DendroMonitor.prototype.getComments = async function(treeId) {
    try {
        const response = await fetch(`${this.apiBase}/comments.py?tree_id=${treeId}`);
        return await response.json();
    } catch (error) {
        console.error('Ошибка получения комментариев:', error);
        return [];
    }
};

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    new TreeDetail();
});