const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

// Создаем Socket.io с CORS для работы через Nginx
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // Укажи свой домен
    methods: ["GET", "POST"],
  },
});

// Порт для запуска сервера
const PORT = 3000;

// Хранилище данных пользователей
let usersData = {};

// Функция для получения топ-3 пользователей
function getTopUsers() {
  return Object.entries(usersData)
    .sort((a, b) => b[1].clicks - a[1].clicks) // Сортируем по количеству кликов
    .slice(0, 3) // Берем только топ-3
    .map(([id, data]) => ({ id, clicks: data.clicks, level: data.level })); // Формируем массив данных
}

// Указываем путь к статическим файлам фронтенда (директория dist)
const distPath = path.join(__dirname, "dist");
app.use(express.static(distPath));

// Обрабатываем все GET-запросы, чтобы возвращать `index.html` (SPA)
app.get("*", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

// Обработка подключения пользователя
io.on("connection", (socket) => {
  console.log("🔗 Новый пользователь подключился");

  // Обработка события "click" от клиента
  socket.on("click", (data) => {
    const { userId, clicks, level } = data;

    // Обновляем данные пользователя
    usersData[userId] = { clicks, level };

    // Отправляем обновленный топ-3 всем клиентам
    io.emit("updateTop", { topUsers: getTopUsers() });

    console.log(`📊 Данные от ${userId}: ${clicks} кликов, уровень: ${level}`);
  });

  // Обработка отключения пользователя
  socket.on("disconnect", () => {
    console.log(`❌ Пользователь отключился: ${socket.id}`);
  });
});

// Запуск сервера
server.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
});