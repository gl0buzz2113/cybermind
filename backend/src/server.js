import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

import apiRoutes from './routes/apiRoutes.js';

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

if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
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
}

export default app;