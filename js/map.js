// Инициализация карты
let map;

function initMap() {
    // Создаем карту с центром в Москве
    map = L.map('map').setView([55.7558, 37.6173], 12);
    
    // Добавляем слой OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18
    }).addTo(map);
    
    // Делаем карту глобально доступной
    window.map = map;
    
    // Загружаем деревья
    loadTrees();
    
    // Настраиваем обработчик кликов если пользователь уже авторизован
    if (window.authManager && window.authManager.isAuthenticated) {
        setTimeout(() => {
            window.setupMapClickHandler();
        }, 1000);
    }
    
    console.log('Карта инициализирована, обработчик кликов готов к настройке');
}

// Глобальная функция для обработки кликов на карту
window.setupMapClickHandler = function() {
    if (!window.map) return;
    
    // Удаляем старые обработчики если есть
    window.map.off('click');
    
    window.map.on('click', function(e) {
        // Проверяем авторизацию
        if (window.authManager && window.authManager.isAuthenticated) {
            const latInput = document.getElementById('tree-latitude');
            const lngInput = document.getElementById('tree-longitude');
            
            if (latInput && lngInput) {
                latInput.value = e.latlng.lat.toFixed(6);
                lngInput.value = e.latlng.lng.toFixed(6);
                
                // Показываем уведомление
                if (window.showNotification) {
                    window.showNotification('📍 Координаты автоматически заполнены!', 'success');
                } else {
                    alert('Координаты автоматически заполнены!');
                }
                
                console.log('Координаты установлены:', e.latlng.lat, e.latlng.lng);
            } else {
                console.log('Поля координат не найдены');
            }
        }
    });
    
    console.log('Обработчик клика на карту установлен');
};

// Загрузка деревьев с сервера
async function loadTrees() {
    try {
        const response = await fetch('/.netlify/functions/trees');
        const trees = await response.json();
        
        trees.forEach(tree => {
            addTreeToMap(tree);
        });
        
        updateStatistics(trees);
    } catch (error) {
        console.error('Ошибка загрузки деревьев:', error);
        loadSampleTrees();
    }
}

// Добавление дерева на карту
function addTreeToMap(tree) {
    const statusColors = {
        'excellent': '#4caf50',
        'good': '#8bc34a',
        'satisfactory': '#ffeb3b',
        'poor': '#ff9800',
        'critical': '#f44336'
    };
    
    const statusNames = {
        'excellent': 'Отличное',
        'good': 'Хорошее',
        'satisfactory': 'Удовлетворительное',
        'poor': 'Плохое',
        'critical': 'Критическое'
    };
    
    const marker = L.circleMarker([tree.latitude, tree.longitude], {
        radius: 8,
        fillColor: statusColors[tree.status] || '#666',
        color: '#fff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8
    }).addTo(map);
    
    const popupContent = `
        <div class="tree-popup">
            <h3>${tree.species}</h3>
            <p><strong>Состояние:</strong> ${statusNames[tree.status]}</p>
            <p><strong>Адрес:</strong> ${tree.address}</p>
            <p><strong>Диаметр:</strong> ${tree.diameter} см</p>
            <p><strong>Высота:</strong> ${tree.height} м</p>
            <a href="tree_detail.html?id=${tree.id}" class="btn">Подробнее</a>
        </div>
    `;
    
    marker.bindPopup(popupContent);
}

// Обновление статистики
function updateStatistics(trees) {
    document.getElementById('total-trees').textContent = trees.length;
    
    const excellentCount = trees.filter(tree => tree.status === 'excellent').length;
    const needCareCount = trees.filter(tree => 
        ['poor', 'critical'].includes(tree.status)
    ).length;
    
    document.getElementById('excellent-trees').textContent = excellentCount;
    document.getElementById('need-care').textContent = needCareCount;
}

// Загрузка тестовых данных (если API не работает)
function loadSampleTrees() {
    const sampleTrees = [
        {
            id: 1,
            latitude: 55.7558,
            longitude: 37.6176,
            species: 'Дуб',
            status: 'excellent',
            address: 'Красная площадь',
            diameter: 85,
            height: 25
        },
        {
            id: 2,
            latitude: 55.7520,
            longitude: 37.6175,
            species: 'Береза',
            status: 'good',
            address: 'ул. Тверская, 10',
            diameter: 45,
            height: 18
        },
        {
            id: 3,
            latitude: 55.7500,
            longitude: 37.6200,
            species: 'Сосна',
            status: 'satisfactory',
            address: 'Парк Горького',
            diameter: 92,
            height: 30
        }
    ];
    
    sampleTrees.forEach(tree => addTreeToMap(tree));
    updateStatistics(sampleTrees);
}

// Инициализация карты при загрузке страницы
document.addEventListener('DOMContentLoaded', initMap);