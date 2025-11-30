exports.handler = async function(event, context) {
  try {
    if (event.httpMethod === 'POST') {
      const data = JSON.parse(event.body);
      
      // Просто возвращаем успех без сохранения
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          success: true, 
          comment_id: Date.now(),
          message: 'Комментарий принят (демо-режим)'
        })
      };
    } else {
      // GET запрос - возвращаем тестовые комментарии
      const { tree_id } = event.queryStringParameters || {};
      
      const sampleComments = [
        {
          id: 1,
          tree_id: parseInt(tree_id),
          user_name: 'Иван Петров',
          text: 'Дерево выглядит здоровым и ухоженным',
          contact_email: 'ivan@example.com',
          created_at: '2024-01-20T10:30:00',
          is_reviewed: true
        },
        {
          id: 2,
          tree_id: parseInt(tree_id),
          user_name: 'Мария Сидорова',
          text: 'Заметил небольшие повреждения коры',
          contact_email: '',
          created_at: '2024-01-18T14:20:00',
          is_reviewed: true
        }
      ];

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sampleComments)
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