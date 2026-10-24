import { STARS_CATALOG, verifyTelegram } from '../_shared.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const tgUser = verifyTelegram(req.headers.authorization);
    if (!tgUser) {
        return res.status(401).json({ error: 'Ошибка проверки авторизации Telegram' });
    }

    const { boostId } = req.body || {};
    const boost = STARS_CATALOG[boostId];
    if (!boost) {
        return res.status(404).json({ error: 'Буст за Stars не найден' });
    }

    let botToken = process.env.BOT_TOKEN?.trim();
    if (botToken && botToken.startsWith('1234567890:') && botToken.split(':').length > 2) {
        botToken = botToken.replace(/^1234567890:/, '');
    }

    const isDummy = !botToken || botToken.startsWith('1234567890:');
    if (isDummy) {
        return res.status(200).json({
            success: true,
            isTestMode: true,
            message: 'Внимание: В переменных окружения BOT_TOKEN не настроен. Активация в тестовом режиме.',
        });
    }

    try {
        const response = await fetch(`https://api.telegram.org/bot${botToken}/createInvoiceLink`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: boost.title,
                description: boost.desc,
                payload: JSON.stringify({ boostId, telegramId: tgUser.id, ts: Date.now() }),
                currency: 'XTR',
                prices: [{ label: boost.title, amount: boost.starsPrice }],
                provider_token: '',
            }),
        });

        const data = await response.json();
        if (!data.ok) {
            return res.status(400).json({ error: data.description || 'Ошибка создания счета в Telegram Stars' });
        }

        return res.status(200).json({
            success: true,
            isTestMode: false,
            invoiceLink: data.result,
        });
    } catch (err) {
        return res.status(500).json({ error: 'Внутренняя ошибка создания счета Stars' });
    }
}
