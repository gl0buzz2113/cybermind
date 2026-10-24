import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes/apiRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Настройка CORS для безопасной работы с фронтендом и Telegram WebApp
app.use(
    cors({
        origin: true, // Зеркалирует Origin клиента (поддерживает localhost, ngrok, Vercel, Telegram WebApp)
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    })
);

app.use(express.json());

// Проверка работоспособности сервера (Healthcheck)
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Подключаем основные маршруты
app.use('/api', apiRoutes);

const server = app.listen(PORT, () => {
    console.log(`🚀 Бэкенд кликера успешно запущен на порту ${PORT}`);
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`❌ Порт ${PORT} уже занят другим процессом Node.js!`);
    } else {
        console.error('❌ Ошибка запуска сервера:', err);
    }
});