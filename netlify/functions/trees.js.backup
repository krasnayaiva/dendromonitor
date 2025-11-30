exports.handler = async function(event, context) {
  try {
    // Временные данные вместо базы данных
    const trees = [
      { id: 1, name: "Дуб", height: 15 },
      { id: 2, name: "Береза", height: 12 },
      { id: 3, name: "Сосна", height: 20 }
    ];

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: "Деревья загружены успешно",
        trees: trees,
        count: trees.length
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Внутренняя ошибка сервера" })
    };
  }
}