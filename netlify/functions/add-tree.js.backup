exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Метод не разрешен' })
    };
  }

  try {
    const data = JSON.parse(event.body);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: "Дерево добавлено успешно",
        tree: data,
        id: Date.now() // временный ID
      })
    };
  } catch (error) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Неверный JSON" })
    };
  }
}