import { Router } from 'express';
import { verifyTelegramWebAppData } from '../middlewares/telegramAuth.js';
import { authenticateUser } from '../controllers/authController.js';
import { syncProgress } from '../controllers/gameController.js';
import { createStarsInvoice, confirmStarsPurchase } from '../controllers/starsController.js';

const router = Router();

// POST /api/auth — Авторизация, регистрация и расчет офлайн-дохода при входе
router.post('/auth', verifyTelegramWebAppData, authenticateUser);

// POST /api/sync — Периодическое сохранение прогресса игрока (баланс, клик, пассивный доход) в БД
router.post('/sync', verifyTelegramWebAppData, syncProgress);

// POST /api/stars/create-invoice — Создание ссылки на инвойс Telegram Stars (XTR)
router.post('/stars/create-invoice', verifyTelegramWebAppData, createStarsInvoice);

// POST /api/stars/confirm — Подтверждение оплаты Stars и начисление супер-буста в БД
router.post('/stars/confirm', verifyTelegramWebAppData, confirmStarsPurchase);

export default router;