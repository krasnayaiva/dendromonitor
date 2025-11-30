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
        this.renderChart(); // Добавляем построение графика
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
                    date_recorded: '2024-03-15',
                    is_future_plan: false
                },
                {
                    id: 2,
                    tree_id: 1,
                    status: 'excellent',
                    notes: 'Регулярный осмотр - всё в порядке',
                    date_recorded: '2024-01-10',
                    is_future_plan: false
                },
                {
                    id: 3,
                    tree_id: 1,
                    status: 'good',
                    notes: 'Небольшие повреждения после шторма',
                    date_recorded: '2023-11-05',
                    is_future_plan: false
                },
                {
                    id: 4,
                    tree_id: 1,
                    status: 'excellent',
                    notes: 'Плановый осмотр после летнего сезона',
                    date_recorded: '2023-09-20',
                    is_future_plan: false
                },
                {
                    id: 5,
                    tree_id: 1,
                    status: 'satisfactory',
                    notes: 'Требуется подкормка после зимы',
                    date_recorded: '2023-04-15',
                    is_future_plan: false
                }
            ],
            2: [
                {
                    id: 6,
                    tree_id: 2,
                    status: 'good',
                    notes: 'Небольшие повреждения коры, требуется наблюдение',
                    date_recorded: '2024-03-10',
                    is_future_plan: false
                },
                {
                    id: 7,
                    tree_id: 2,
                    status: 'satisfactory',
                    notes: 'Обнаружены вредители, проведена обработка',
                    date_recorded: '2024-01-15',
                    is_future_plan: false
                },
                {
                    id: 8,
                    tree_id: 2,
                    status: 'good',
                    notes: 'Состояние улучшилось после лечения',
                    date_recorded: '2023-12-01',
                    is_future_plan: false
                },
                {
                    id: 9,
                    tree_id: 2,
                    status: 'poor',
                    notes: 'Сильное поражение вредителями',
                    date_recorded: '2023-10-20',
                    is_future_plan: false
                }
            ],
            3: [
                {
                    id: 10,
                    tree_id: 3,
                    status: 'satisfactory',
                    notes: 'Требуется санитарная обрезка сухих веток',
                    date_recorded: '2024-03-12',
                    is_future_plan: false
                },
                {
                    id: 11,
                    tree_id: 3,
                    status: 'satisfactory',
                    notes: 'Проведена частичная обрезка',
                    date_recorded: '2024-01-20',
                    is_future_plan: false
                },
                {
                    id: 12,
                    tree_id: 3,
                    status: 'poor',
                    notes: 'Много сухих веток после урагана',
                    date_recorded: '2023-12-05',
                    is_future_plan: false
                },
                {
                    id: 13,
                    tree_id: 3,
                    status: 'good',
                    notes: 'Плановый осмотр перед зимой',
                    date_recorded: '2023-10-10',
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
    
    // Добавляем метод для построения графика
    renderChart() {
        const canvas = document.getElementById('statusChart');
        if (!canvas) {
            console.log('Chart canvas not found');
            return;
        }
        
        const statusHistory = this.treeData.status_history || [];
        
        if (statusHistory.length < 2) {
            console.log('Not enough data for chart');
            const chartContainer = document.querySelector('.chart-container');
            if (chartContainer) {
                chartContainer.innerHTML = '<div class="loading">Недостаточно данных для построения графика (нужно минимум 2 записи)</div>';
            }
            return;
        }
        
        console.log('Rendering chart with data:', statusHistory);
        
        const statusValues = {
            'excellent': 5,
            'good': 4,
            'satisfactory': 3,
            'poor': 2,
            'critical': 1
        };
        
        // Сортируем по дате (от старых к новым)
        const sortedHistory = [...statusHistory].sort((a, b) => 
            new Date(a.date_recorded) - new Date(b.date_recorded)
        );
        
        const labels = sortedHistory.map(status => this.formatChartDate(status.date_recorded));
        const data = sortedHistory.map(status => statusValues[status.status] || 3);
        
        const ctx = canvas.getContext('2d');
        
        // Убедимся что Chart.js доступен
        if (typeof Chart === 'undefined') {
            console.error('Chart.js is not loaded');
            return;
        }
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Состояние дерева',
                    data: data,
                    borderColor: '#4caf50',
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#4caf50',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        min: 1,
                        max: 5,
                        ticks: {
                            stepSize: 1,
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
                        },
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
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
                            },
                            afterLabel: function(context) {
                                const index = context.dataIndex;
                                const history = sortedHistory[index];
                                return history.notes || '';
                            }
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    }
    
    formatChartDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
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
        
        // Сортируем от новых к старым
        const sortedHistory = [...history].sort((a, b) => 
            new Date(b.date_recorded) - new Date(a.date_recorded)
        );
        
        container.innerHTML = sortedHistory.map(item => `
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
        
        alert('В демо-режиме комментарии не сохраняются. В реальном приложении здесь будет отправка на сервер.');
        form.reset();
        
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