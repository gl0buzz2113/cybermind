import { supabase } from '../config/supabase.js';

// Конфигурация супер-бустов Stars
const STARS_CATALOG = {
    stars_tap_super: {
        title: 'Сингулярный Чип ИИ',
        desc: 'Мгновенно +50 к силе тапа навсегда',
        starsPrice: 25,
        type: 'click_power',
        value: 50,
    },
    stars_miner_super: {
        title: 'Квантовый Майнер-Синдикат',
        desc: '+150/сек к пассивному доходу навсегда (+540 000 в час!)',
        starsPrice: 50,
        type: 'passive_income',
        value: 150,
    },
    stars_energy_super: {
        title: 'Бесконечный Реактор',
        desc: '+5000 к макс. энергии и регенерация x5',
        starsPrice: 75,
        type: 'special_energy',
        value: 5000,
    },
};

/**
 * Создание официальной ссылки на оплату через Telegram Stars (валюта XTR)
 */
export const createStarsInvoice = async (req, res) => {
    try {
        const telegramId = Number(req.telegramUser?.id);
        const { boostId } = req.body;

        if (!telegramId) {
            return res.status(401).json({ error: 'Пользователь не авторизован' });
        }

        const boost = STARS_CATALOG[boostId];
        if (!boost) {
            return res.status(404).json({ error: 'Буст за Stars не найден' });
        }

        const botToken = process.env.BOT_TOKEN;
        if (!botToken || botToken.startsWith('1234567890:')) {
            return res.status(400).json({
                error: 'Для оплаты Telegram Stars необходимо указать реальный BOT_TOKEN в .env бэкенда',
            });
        }

        // Вызываем официальный метод Telegram Bot API createInvoiceLink
        const response = await fetch(`https://api.telegram.org/bot${botToken}/createInvoiceLink`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: boost.title,
                description: boost.desc,
                payload: JSON.stringify({ boostId, telegramId, ts: Date.now() }),
                currency: 'XTR', // Официальная валюта Telegram Stars
                prices: [{ label: boost.title, amount: boost.starsPrice }],
            }),
        });

        const data = await response.json();

        if (!data.ok) {
            console.error('[Telegram Stars API Error]:', data);
            return res.status(400).json({
                error: data.description || 'Не удалось создать инвойс Telegram Stars',
            });
        }

        return res.status(200).json({
            success: true,
            invoiceLink: data.result,
        });
    } catch (error) {
        console.error('[CreateInvoice Error]:', error);
        return res.status(500).json({ error: 'Внутренняя ошибка создания счета Stars' });
    }
};

/**
 * Подтверждение успешной оплаты Stars и начисление буста в базу данных Supabase
 */
export const confirmStarsPurchase = async (req, res) => {
    try {
        const telegramId = Number(req.telegramUser?.id);
        const { boostId } = req.body;

        if (!telegramId) {
            return res.status(401).json({ error: 'Пользователь не авторизован' });
        }

        const boost = STARS_CATALOG[boostId];
        if (!boost) {
            return res.status(404).json({ error: 'Буст за Stars не найден' });
        }

        // Получаем текущие данные юзера
        const { data: user, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('id', telegramId)
            .single();

        if (fetchError || !user) {
            return res.status(404).json({ error: 'Игрок не найден в базе данных' });
        }

        const updates = {
            last_leak_time: new Date().toISOString(),
        };

        if (boost.type === 'click_power') {
            updates.click_power = Number(user.click_power || 1) + boost.value;
        } else if (boost.type === 'passive_income') {
            updates.passive_income = Number(user.passive_income || 0) + boost.value;
        } else if (boost.type === 'special_energy') {
            updates.max_energy = Number(user.max_energy || 1000) + boost.value;
            updates.energy = Number(user.energy || 1000) + boost.value;
        }

        const { data: updatedUser, error: updateError } = await supabase
            .from('users')
            .update(updates)
            .eq('id', telegramId)
            .select()
            .single();

        if (updateError) {
            throw updateError;
        }

        return res.status(200).json({
            success: true,
            user: updatedUser,
        });
    } catch (error) {
        console.error('[ConfirmStars Error]:', error);
        return res.status(500).json({ error: 'Не удалось активировать буст за Stars' });
    }
};
