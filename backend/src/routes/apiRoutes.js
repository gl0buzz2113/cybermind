import { Router } from 'express';
import { verifyTelegramWebAppData } from '../middlewares/telegramAuth.js';
import { authenticateUser } from '../controllers/authController.js';
import { syncProgress } from '../controllers/gameController.js';

const router = Router();

// POST /api/auth — Авторизация, регистрация и расчет офлайн-дохода при входе
router.post('/auth', verifyTelegramWebAppData, authenticateUser);

// POST /api/sync — Периодическое сохранение прогресса игрока (баланс, энергия) в БД
router.post('/sync', verifyTelegramWebAppData, syncProgress);

export default router;