import crypto from 'crypto';

export const verifyTelegramWebAppData = (req, res, next) => {
    try {
        // Принимаем initData либо из заголовка Authorization (рекомендуется), либо из тела запроса
        // Если включен DEV_MODE и мы зашли из обычного браузера без Telegram
        if (process.env.DEV_MODE === 'true' && req.headers.authorization === 'tma dev_mode') {
            req.telegramUser = { id: 7777777, username: 'local_developer', first_name: 'Dev' };
            req.startParam = null;
            return next();
        }
        const authHeader = req.headers.authorization;
        const initData = authHeader?.startsWith('tma ')
            ? authHeader.slice(4)
            : req.body?.initData;

        if (!initData) {
            return res.status(401).json({ error: 'Отсутствует строка авторизации initData' });
        }

        let botToken = process.env.BOT_TOKEN?.trim();
        if (botToken && botToken.startsWith('1234567890:') && botToken.split(':').length > 2) {
            botToken = botToken.replace(/^1234567890:/, '');
        }
        if (!botToken) {
            throw new Error('BOT_TOKEN не настроен на сервере');
        }

        const urlParams = new URLSearchParams(initData);
        const receivedHash = urlParams.get('hash');

        if (!receivedHash) {
            return res.status(401).json({ error: 'Отсутствует криптографический hash в initData' });
        }

        // Удаляем hash перед формированием проверочной строки
        urlParams.delete('hash');

        // Сортируем ключи по алфавиту и склеиваем в формат key=value через символ переноса строки (\n)
        const dataCheckString = Array.from(urlParams.entries())
            .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
            .map(([key, value]) => `${key}=${value}`)
            .join('\n');

        // 1. Создаем секретный ключ: HMAC-SHA256 от BOT_TOKEN с константой "WebAppData"
        const secretKey = crypto
            .createHmac('sha256', 'WebAppData')
            .update(botToken)
            .digest();

        // 2. Вычисляем хеш от dataCheckString с использованием полученного secretKey
        const calculatedHash = crypto
            .createHmac('sha256', secretKey)
            .update(dataCheckString)
            .digest('hex');

        // 3. Безопасное побайтовое сравнение хешей
        const receivedBuffer = Buffer.from(receivedHash, 'hex');
        const calculatedBuffer = Buffer.from(calculatedHash, 'hex');

        if (
            receivedBuffer.length !== calculatedBuffer.length ||
            !crypto.timingSafeEqual(receivedBuffer, calculatedBuffer)
        ) {
            return res.status(403).json({ error: 'Неверная подпись данных Telegram (Invalid hash)' });
        }

        // 4. Защита от Replay-атак: проверяем свежесть данных (срок жизни сессии — 24 часа)
        const authDate = Number(urlParams.get('auth_date'));
        const currentTimestamp = Math.floor(Date.now() / 1000);
        const MAX_AGE_SECONDS = 86400; // 24 часа

        if (!authDate || currentTimestamp - authDate > MAX_AGE_SECONDS) {
            return res.status(401).json({ error: 'Сессия initData устарела, перезапустите апп' });
        }

        // 5. Парсим данные пользователя и реферальный параметр
        const rawUser = urlParams.get('user');
        if (!rawUser) {
            return res.status(400).json({ error: 'Объект user отсутствует в initData' });
        }

        req.telegramUser = JSON.parse(rawUser);
        req.startParam = urlParams.get('start_param') || null;

        next();
    } catch (error) {
        console.error('[TelegramAuth Error]:', error);
        return res.status(500).json({ error: 'Внутренняя ошибка при проверке авторизации' });
    }
};