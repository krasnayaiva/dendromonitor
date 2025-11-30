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
        const id = urlParams.get('id');
        console.log('Tree ID from URL:', id);
        return id || '1'; // По умолчанию первое дерево
    }
    
    // Инициализация страницы
    async init() {
        console.log('Initializing tree detail for ID:', this.treeId);
        
        if (!this.treeId) {
            this.showError('ID дерева не указан');
            return;
        }
        
        await this.loadTreeData();
        this.renderTreeInfo();
        this.setupEventListeners();
    }
    
    // Загрузка данных о дереве
    async loadTreeData() {
        try {
            console.log('Loading tree data...');
            
            const response = await fetch(`/.netlify/functions/trees?id=${this.treeId}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('API response:', data);
            
            // Проверяем структуру ответа
            if (data.tree) {
                // Ответ для одного дерева
                this.treeData = data;
            } else if (data.id) {
                // Ответ - одно дерево напрямую
                this.treeData = {
                    tree: data,
                    status_history: [],
                    comments: []
                };
            } else {
                throw new Error('Неверный формат данных');
            }
            
            console.log('Tree data processed:', this.treeData);
            
        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
            // Используем тестовые данные
            this.treeData = this.getSampleTreeData();
            console.log('Using sample data:', this.treeData);
        }
    }
    
    // Отображение информации о дереве
    renderTreeInfo() {
        if (!this.treeData || !this.treeData.tree) {
            console.error('No tree data available');
            this.showError('Данные о дереве не загружены');
            return;
        }
        
        const tree = this.treeData.tree;
        console.log('Rendering tree info:', tree);
        
        try {
            // Обновляем заголовки
            const treeNameElement = document.getElementById('tree-name');
            const treeSpeciesElement = document.getElementById('tree-species');
            
            if (treeNameElement) treeNameElement.textContent = tree.species || 'Дерево';
            if (treeSpeciesElement) treeSpeciesElement.textContent = tree.species || 'Дерево';
            
            // Статус
            const statusBadge = document.getElementById('status-badge');
            if (statusBadge) {
                const currentStatus = this.getCurrentStatus();
                statusBadge.textContent = this.getStatusText(currentStatus);
                statusBadge.className = `status-badge ${currentStatus}`;
            }
            
            // Детали
            this.updateElement('tree-address', tree.address || 'Не указан');
            this.updateElement('tree-diameter', tree.diameter ? `${tree.diameter} см` : 'Не измерен');
            this.updateElement('tree-height', tree.height ? `${tree.height} м` : 'Не измерена');
            this.updateElement('tree-coordinates', 
                `${tree.latitude?.toFixed(4) || '0'}, ${tree.longitude?.toFixed(4) || '0'}`);
                
            // Рендерим остальные секции
            this.renderStatusHistory();
            this.loadComments();
            
        } catch (error) {
            console.error('Error rendering tree info:', error);
            this.showError('Ошибка отображения информации');
        }
    }
    
    // Вспомогательная функция для безопасного обновления элементов
    updateElement(id, text) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = text;
        } else {
            console.warn(`Element with id ${id} not found`);
        }
    }
    
    // Отображение истории статусов
    renderStatusHistory() {
        const container = document.getElementById('status-history-list');
        if (!container) {
            console.warn('Status history container not found');
            return;
        }
        
        const statusHistory = this.treeData.status_history || [];
        console.log('Rendering status history:', statusHistory);
        
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
    
    // Загрузка комментариев
    async loadComments() {
        const container = document.getElementById('comments-list');
        if (!container) {
            console.warn('Comments container not found');
            return;
        }
        
        try {
            const response = await fetch(`/.netlify/functions/comments?tree_id=${this.treeId}`);
            let comments = [];
            
            if (response.ok) {
                comments = await response.json();
            }
            
            console.log('Loaded comments:', comments);
            
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
        if (form) {
            form.addEventListener('submit', (e) => this.handleCommentSubmit(e));
        } else {
            console.warn('Comment form not found');
        }
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
        
        if (!commentData.text || !commentData.text.trim()) {
            alert('Пожалуйста, напишите ваше сообщение');
            return;
        }
        
        // Блокируем кнопку
        submitBtn.disabled = true;
        submitBtn.textContent = 'Отправка...';
        
        try {
            const result = await fetch('/.netlify/functions/comments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    tree_id: parseInt(this.treeId),
                    ...commentData
                })
            });
            
            const response = await result.json();
            
            if (response.success) {
                alert('Ваше сообщение успешно отправлено!');
                form.reset();
                this.loadComments(); // Перезагружаем комментарии
            } else {
                throw new Error(response.error || 'Ошибка отправки');
            }
            
        } catch (error) {
            console.error('Ошибка отправки комментария:', error);
            alert('Ошибка отправки сообщения. Попробуйте еще раз.');
        } finally {
            // Разблокируем кнопку
            submitBtn.disabled = false;
            submitBtn.textContent = '📤 Отправить сообщение';
        }
    }
    
    // Вспомогательные методы
    getCurrentStatus() {
        const statusHistory = this.treeData.status_history || [];
        if (statusHistory.length === 0) {
            return this.treeData.tree.status || 'unknown';
        }
        
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
    
    formatDate(dateString) {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('ru-RU');
        } catch (e) {
            return dateString;
        }
    }
    
    formatDateTime(dateTimeString) {
        try {
            const date = new Date(dateTimeString);
            return date.toLocaleString('ru-RU');
        } catch (e) {
            return dateTimeString;
        }
    }
    
    showError(message) {
        const main = document.querySelector('.main');
        if (main) {
            main.innerHTML = `
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
    }
    
    // Тестовые данные для демонстрации
    getSampleTreeData() {
        return {
            tree: {
                id: parseInt(this.treeId),
                species: 'Дуб',
                address: 'Примерный адрес расположения',
                latitude: 55.7558,
                longitude: 37.6176,
                diameter: 85,
                height: 25,
                status: 'excellent'
            },
            status_history: [
                {
                    date_recorded: '2024-01-15',
                    status: 'excellent',
                    notes: 'Дерево в отличном состоянии, признаков болезней нет',
                    is_future_plan: false
                }
            ],
            comments: []
        };
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    console.log('Tree detail page loaded');
    new TreeDetail();
});