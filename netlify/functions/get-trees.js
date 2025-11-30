exports.handler = async function(event, context) {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: "Деревья загружены успешно",
      trees: [
        { id: 1, name: "Дуб", height: 15 },
        { id: 2, name: "Береза", height: 12 }
      ]
    })
  };
}