class TreeDetail {
    constructor() {
        this.treeId = this.getTreeIdFromUrl();
        this.treeData = null;
        this.init();
    }
    
    getTreeIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        const id = urlParams.get('id');
        return id || '1';
    }
    
    async init() {
        await this.loadTreeData();
        this.renderTreeInfo();
        this.setupEventListeners();
    }
    
    async loadTreeData() {
        // Используем локальные данные вместо API
        const allTrees = this.getSampleTrees();
        const treeId = parseInt(this.treeId);
        
        // Находим дерево по ID
        const tree = allTrees.find(t => t.id === treeId) || allTrees[0];
        
        this.treeData = {
            tree: tree,
            status_history: this.getStatusHistory(treeId),
            comments: this.getComments(treeId)
        };
        
        console.log('Loaded tree data:', this.treeData);
    }
    
    getSampleTrees() {
        return [
            {
                id: 1,
                latitude: 55.7558,
                longitude: 37.6176,
                species: 'Дуб',
                address: 'Красная площадь, 1',
                diameter: 85.5,
                height: 25.0,
                status: 'excellent'
            },
            {
                id: 2,
                latitude: 55.7520,
                longitude: 37.6175,
                species: 'Береза',
                address: 'ул. Тверская, 10',
                diameter: 45.2,
                height: 18.5,
                status: 'good'
            },
            {
                id: 3,
                latitude: 55.7500,
                longitude: 37.6200,
                species: 'Сосна',
                address: 'Парк Горького, центральная аллея',
                diameter: 92.1,
                height: 30.2,
                status: 'satisfactory'
            },
            {
                id: 4,
                latitude: 55.7490,
                longitude: 37.6150,
                species: 'Клен',
                address: 'ул. Большая Дмитровка, 15',
                diameter: 32.8,
                height: 12.3,
                status: 'poor'
            },
            {
                id: 5,
                latitude: 55.7475,
                longitude: 37.6225,
                species: 'Липа',
                address: 'Чистопрудный бульвар',
                diameter: 68.7,
                height: 22.1,
                status: 'critical'
            }
        ];
    }
    
    getStatusHistory(treeId) {
        const histories = {
            1: [
                {
                    id: 1,
                    tree_id: 1,
                    status: 'excellent',
                    notes: 'Дерево в отличном состоянии, признаков болезней нет',
                    date_recorded: '2024-01-15',
                    is_future_plan: false
                }
            ],
            2: [
                {
                    id: 2,
                    tree_id: 2,
                    status: 'good',
                    notes: 'Небольшие повреждения коры, требуется наблюдение',
                    date_recorded: '2024-01-10',
                    is_future_plan: false
                }
            ],
            3: [
                {
                    id: 3,
                    tree_id: 3,
                    status: 'satisfactory',
                    notes: 'Требуется санитарная обрезка сухих веток',
                    date_recorded: '2024-01-12',
                    is_future_plan: false
                }
            ],
            4: [
                {
                    id: 4,
                    tree_id: 4,
                    status: 'poor',
                    notes: 'Признаки заболевания, требуется лечение',
                    date_recorded: '2024-01-08',
                    is_future_plan: false
                }
            ],
            5: [
                {
                    id: 5,
                    tree_id: 5,
                    status: 'critical',
                    notes: 'Сильное повреждение ствола, требуется срочный осмотр',
                    date_recorded: '2024-01-05',
                    is_future_plan: false
                }
            ]
        };
        
        return histories[treeId] || [];
    }
    
    getComments(treeId) {
        const allComments = {
            1: [
                {
                    id: 1,
                    tree_id: 1,
                    user_name: 'Иван Петров',
                    text: 'Дерево выглядит здоровым и ухоженным. Очень красивое!',
                    contact_email: 'ivan@example.com',
                    created_at: '2024-01-20T10:30:00',
                    is_reviewed: true
                },
                {
                    id: 2,
                    tree_id: 1,
                    user_name: 'Мария Сидорова',
                    text: 'Люблю гулять рядом с этим дубом, он такой величественный!',
                    contact_email: '',
                    created_at: '2024-01-18T14:20:00',
                    is_reviewed: true
                }
            ],
            2: [
                {
                    id: 3,
                    tree_id: 2,
                    user_name: 'Алексей',
                    text: 'Заметил, что кора немного повреждена в нижней части',
                    contact_email: 'alex@example.com',
                    created_at: '2024-01-19T09:15:00',
                    is_reviewed: true
                }
            ],
            3: [
                {
                    id: 4,
                    tree_id: 3,
                    user_name: 'Ольга',
                    text: 'На сосне появилось много сухих веток, возможно требуется обрезка',
                    contact_email: 'olga@example.com',
                    created_at: '2024-01-17T16:45:00',
                    is_reviewed: true
                }
            ]
        };
        
        return allComments[treeId] || [];
    }
    
    renderTreeInfo() {
        if (!this.treeData || !this.treeData.tree) {
            this.showError('Данные о дереве не загружены');
            return;
        }
        
        const tree = this.treeData.tree;
        
        // Обновляем информацию
        this.updateElement('tree-name', tree.species);
        this.updateElement('tree-species', tree.species);
        this.updateElement('tree-address', tree.address);
        this.updateElement('tree-diameter', tree.diameter ? `${tree.diameter} см` : 'Не измерен');
        this.updateElement('tree-height', tree.height ? `${tree.height} м` : 'Не измерена');
        this.updateElement('tree-coordinates', 
            `${tree.latitude.toFixed(4)}, ${tree.longitude.toFixed(4)}`);
        
        // Статус
        const statusBadge = document.getElementById('status-badge');
        if (statusBadge) {
            statusBadge.textContent = this.getStatusText(tree.status);
            statusBadge.className = `status-badge ${tree.status}`;
        }
        
        // История статусов
        this.renderStatusHistory();
        
        // Комментарии
        this.renderComments();
    }
    
    updateElement(id, text) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = text;
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
            <div class="status-item ${item.is_future_plan ? 'future-plan' : ''}">
                <div class="status-header">
                    <span class="status-date">${this.formatDate(item.date_recorded)}</span>
                    ${item.is_future_plan ? 
                        '<span class="status-type plan">📅 План</span>' : 
                        ''}
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
    
    renderComments() {
        const container = document.getElementById('comments-list');
        if (!container) return;
        
        const comments = this.treeData.comments || [];
        
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
    }
    
    setupEventListeners() {
        const form = document.getElementById('comment-form');
        if (form) {
            form.addEventListener('submit', (e) => this.handleCommentSubmit(e));
        }
    }
    
    handleCommentSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
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
        
        // В демо-режиме просто показываем сообщение
        alert('В демо-режиме комментарии не сохраняются. В реальном приложении здесь будет отправка на сервер.');
        form.reset();
        
        // Можно добавить комментарий в локальный список
        this.addDemoComment(commentData);
    }
    
    addDemoComment(commentData) {
        const newComment = {
            id: Date.now(),
            tree_id: parseInt(this.treeId),
            user_name: commentData.user_name || 'Аноним',
            text: commentData.text,
            contact_email: commentData.contact_email || '',
            created_at: new Date().toISOString(),
            is_reviewed: true
        };
        
        if (!this.treeData.comments) {
            this.treeData.comments = [];
        }
        
        this.treeData.comments.unshift(newComment);
        this.renderComments();
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
    
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU');
    }
    
    formatDateTime(dateTimeString) {
        const date = new Date(dateTimeString);
        return date.toLocaleString('ru-RU');
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
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    new TreeDetail();
});