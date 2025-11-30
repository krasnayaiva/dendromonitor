// Простая версия без базы данных
exports.handler = async function(event, context) {
  const { id } = event.queryStringParameters || {};
  
  // Тестовые данные
  const sampleTrees = [
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

  try {
    if (id) {
      // Поиск конкретного дерева
      const treeId = parseInt(id);
      const tree = sampleTrees.find(t => t.id === treeId);
      
      if (!tree) {
        return {
          statusCode: 404,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Tree not found' })
        };
      }

      // Тестовая история статусов
      const statusHistory = [
        {
          id: 1,
          tree_id: treeId,
          status: tree.status,
          notes: 'Первоначальная оценка',
          date_recorded: '2024-01-15',
          is_future_plan: false
        }
      ];

      // Тестовые комментарии
      const comments = [
        {
          id: 1,
          tree_id: treeId,
          user_name: 'Иван Петров',
          text: 'Дерево выглядит здоровым и ухоженным',
          contact_email: 'ivan@example.com',
          created_at: '2024-01-20T10:30:00',
          is_reviewed: true
        }
      ];

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tree: tree,
          status_history: statusHistory,
          comments: comments
        })
      };
    } else {
      // Все деревья
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sampleTrees)
      };
    }
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};