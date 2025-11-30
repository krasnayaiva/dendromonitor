const Database = require('better-sqlite3');
const db = new Database(':memory:');
const path = require('path');

exports.handler = async function(event, context) {
  // Для Netlify Functions нужно использовать другую БД
  // Например, JSON файл или внешнюю БД
  const trees = [
    {
      id: 1,
      latitude: 55.7558,
      longitude: 37.6176,
      species: 'Дуб',
      status: 'excellent',
      address: 'Красная площадь, 1',
      diameter: 85.5,
      height: 25.0
    }
  ];

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify(trees)
  };
};