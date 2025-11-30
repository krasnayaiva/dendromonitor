class TreeDetail {
    constructor() {
        this.treeId = this.getTreeIdFromUrl();
        this.treeData = null;
        console.log('TreeDetail initialized with ID:', this.treeId);
        this.init();
    }
    
    getTreeIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        const id = urlParams.get('id');
        return id || '1';
    }
    
    async init() {
        console.log('Starting initialization...');
        await this.loadTreeData();
        this.renderTreeInfo();
        this.setupEventListeners();
    }
    
    async loadTreeData() {
        console.log('Loading tree data for ID:', this.treeId);
        
        try {
            const apiUrl = `/.netlify/functions/trees?id=${this.treeId}`;
            console.log('Fetching from:', apiUrl);
            
            const response = await fetch(apiUrl);
            console.log('Response status:', response.status);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('API response data:', data);
            
            this.treeData = data;
            
        } catch (error) {
            console.error('Error loading tree data:', error);
            // Используем тестовые данные
            this.treeData = this.getSampleTreeData();
            console.log('Using sample data:', this.treeData);
        }
    }
    
    renderTreeInfo() {
        console.log('Rendering tree info with data:', this.treeData);
        
        if (!this.treeData) {
            this.showError('Данные не загружены');
            return;
        }
        
        const tree = this.treeData.tree || this.treeData;
        
        // Обновляем информацию
        this.updateElement('tree-name', tree.species || 'Дерево');
        this.updateElement('tree-species', tree.species || 'Дерево');
        this.updateElement('tree-address', tree.address || 'Адрес не указан');
        this.updateElement('tree-diameter', tree.diameter ? `${tree.diameter} см` : 'Не измерен');
        this.updateElement('tree-height', tree.height ? `${tree.height} м` : 'Не измерена');
        this.updateElement('tree-coordinates', 
            `${tree.latitude || '0'}, ${tree.longitude || '0'}`);
        
        // Статус
        const statusBadge = document.getElementById('status-badge');
        if (statusBadge) {
            const status = tree.status || 'unknown';
            statusBadge.textContent = this.getStatusText(status);
            statusBadge.className = `status-badge ${status}`;
        }
        
        // История статусов
        this.renderStatusHistory();
        
        // Комментарии
        this.loadComments();
    }
    
    updateElement(id, text) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = text;
        } else {
            console.warn('Element not found:', id);
        }
    }
    
    renderStatusHistory() {
        const container = document.getElementById('status-history-list');
        if (!container) return;
        
        const history = this.treeData.status_history || [];
        
        if (history.length === 0) {
            container.innerHTML = '<div class="loading">Нет записей о состоянии</div>';
            return;
        }
        
        container.innerHTML = history.map(item => `
            <div class="status-item">
                <div class="status-header">
                    <span class="status-date">${item.date_recorded || 'Не указана'}</span>
                </div>
                <div class="status-value">
                    <strong>Состояние:</strong> ${this.getStatusText(item.status)}
                </div>
                ${item.notes ? `
                    <div class="status-notes">
                        <strong>Заметки:</strong> ${item.notes}
                    </div>
                ` : ''}
            </div>
        `).join('');
    }
    
    async loadComments() {
        const container = document.getElementById('comments-list');
        if (!container) return;
        
        try {
            const response = await fetch(`/.netlify/functions/comments?tree_id=${this.treeId}`);
            const comments = response.ok ? await response.json() : [];
            
            if (comments.length === 0) {
                container.innerHTML = '<div class="loading">Пока нет сообщений</div>';
                return;
            }
            
            container.innerHTML = comments.map(comment => `
                <div class="comment-item">
                    <div class="comment-header">
                        <span class="comment-author">${comment.user_name || 'Аноним'}</span>
                        <span class="comment-date">${comment.created_at || ''}</span>
                    </div>
                    <div class="comment-text">${comment.text}</div>
                </div>
            `).join('');
            
        } catch (error) {
            console.error('Error loading comments:', error);
            container.innerHTML = '<div class="loading">Ошибка загрузки комментариев</div>';
        }
    }
    
    setupEventListeners() {
        const form = document.getElementById('comment-form');
        if (form) {
            form.addEventListener('submit', (e) => this.handleCommentSubmit(e));
        }
    }
    
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
        
        if (!commentData.text?.trim()) {
            alert('Напишите сообщение');
            return;
        }
        
        submitBtn.disabled = true;
        submitBtn.textContent = 'Отправка...';
        
        try {
            const response = await fetch('/.netlify/functions/comments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tree_id: parseInt(this.treeId),
                    ...commentData
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                alert('Сообщение отправлено!');
                form.reset();
                this.loadComments();
            } else {
                throw new Error(result.error);
            }
            
        } catch (error) {
            alert('Ошибка отправки: ' + error.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = '📤 Отправить сообщение';
        }
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
    
    showError(message) {
        const main = document.querySelector('.main');
        if (main) {
            main.innerHTML = `
                <div class="container">
                    <div style="text-align: center; padding: 2rem; color: #666;">
                        <h2>Ошибка</h2>
                        <p>${message}</p>
                        <a href="index.html" class="btn">На главную</a>
                    </div>
                </div>
            `;
        }
    }
    
    getSampleTreeData() {
        return {
            tree: {
                id: parseInt(this.treeId),
                species: 'Дуб',
                address: 'Красная площадь, 1',
                latitude: 55.7558,
                longitude: 37.6176,
                diameter: 85.5,
                height: 25.0,
                status: 'excellent'
            },
            status_history: [
                {
                    date_recorded: '2024-01-15',
                    status: 'excellent',
                    notes: 'Дерево в отличном состоянии'
                }
            ],
            comments: []
        };
    }
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    new TreeDetail();
});