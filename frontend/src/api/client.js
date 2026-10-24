import { createClient } from '@supabase/supabase-js';

// Публичный URL бэкенда (если настроен)
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:4000' : '');

// Настройки Supabase (работает напрямую как надежный отказоустойчивый движок)
const SUPABASE_URL = 'https://zxxomssbzidyovtfvwdc.supabase.co';
const SUPABASE_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4eG9tc3NiemlkeW92dGZ2d2RjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5Mjg2MjQ2MCwiZXhwIjoyMTA4NDM4NDYwfQ.MH-VvZjM1LVi73ENtB4pEt-nWzXtyVz6TJz1L2x3ijs';

export const directSupabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
});

// Официальный токен Telegram бота для создания инвойсов Stars
const TELEGRAM_BOT_TOKEN = '8938575822:AAEliYQRcwc3O_BdeTSMpmEVRinOJQIJm2c';

// Каталог супер-бустов Stars
export const STARS_CATALOG = {
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
 * Получение Telegram-пользователя из контекста WebApp или локального хранилища
 */
export const getTelegramUser = () => {
    const tg = window.Telegram?.WebApp;
    if (tg?.initDataUnsafe?.user?.id) {
        return tg.initDataUnsafe.user;
    }

    // Если открыто в обычном браузере на ПК
    let storedId = localStorage.getItem('cw_fallback_uid');
    if (!storedId) {
        storedId = '7777777';
        localStorage.setItem('cw_fallback_uid', storedId);
    }

    return {
        id: Number(storedId),
        username: 'local_operator',
        first_name: 'Operator',
    };
};

/**
 * Расчет офлайн-дохода (до 3 часов) и восстановления энергии
 */
const calculateOfflineStats = (lastLeakStr, passiveIncome, currentEnergy, maxEnergy) => {
    const now = Date.now();
    const lastLeak = lastLeakStr ? new Date(lastLeakStr).getTime() : now;
    const elapsedSeconds = Math.max(0, Math.floor((now - (isNaN(lastLeak) ? now : lastLeak)) / 1000));

    const MAX_OFFLINE_SECONDS = 3 * 3600; // 3 часа максимум
    const effectiveSeconds = Math.min(elapsedSeconds, MAX_OFFLINE_SECONDS);
    const earnedPoints = effectiveSeconds * (Number(passiveIncome) || 0);

    const maxE = Number(maxEnergy) || 1000;
    const curE = Number(currentEnergy) || maxE;
    const regeneratedEnergy = Math.min(maxE, curE + elapsedSeconds);

    return {
        secondsAway: elapsedSeconds,
        earnedPoints,
        regeneratedEnergy,
    };
};

/**
 * Авторизация и загрузка профиля (Синхронизация между ПК и Телефоном)
 */
export const loginWithTelegram = async () => {
    const tg = window.Telegram?.WebApp;
    const initData = tg?.initData || 'dev_mode';
    const tgUser = getTelegramUser();

    // 1. Пробуем подключиться к бэкенд API, если адрес задан
    if (API_URL) {
        try {
            const targetUrl = `${API_URL}/api/auth`;
            const response = await fetch(targetUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `tma ${initData}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                return data;
            }
        } catch (serverErr) {
            console.debug('[Backend API unreachable, using direct Supabase cloud sync]:', serverErr.message);
        }
    }

    // 2. Отказоустойчивое облачное подключение напрямую к Supabase
    const telegramId = Number(tgUser.id);
    const username = tgUser.username || tgUser.first_name || `agent_${telegramId}`;

    const { data: existingUser, error: fetchErr } = await directSupabase
        .from('users')
        .select('*')
        .eq('id', telegramId)
        .maybeSingle();

    if (fetchErr) {
        console.error('[Supabase Fetch Error]:', fetchErr);
    }

    const nowIso = new Date().toISOString();

    if (existingUser) {
        // Игрок уже есть в единой облачной базе -> считаем офлайн-фарм
        const stats = calculateOfflineStats(
            existingUser.last_leak_time,
            existingUser.passive_income,
            existingUser.energy,
            existingUser.max_energy
        );

        const newBalance = Number(existingUser.balance || 0) + stats.earnedPoints;

        const { data: updatedUser, error: updateErr } = await directSupabase
            .from('users')
            .update({
                username,
                balance: newBalance,
                energy: stats.regeneratedEnergy,
                last_leak_time: nowIso,
            })
            .eq('id', telegramId)
            .select()
            .single();

        return {
            user: updatedUser || { ...existingUser, balance: newBalance, energy: stats.regeneratedEnergy },
            isNewUser: false,
            offlineStats: {
                secondsAway: stats.secondsAway,
                earnedPoints: stats.earnedPoints,
            },
        };
    }

    // Новый игрок -> создаем запись в Supabase
    const { data: newUser, error: insertErr } = await directSupabase
        .from('users')
        .insert({
            id: telegramId,
            username: username,
            balance: 0,
            energy: 1000,
            max_energy: 1000,
            click_power: 1,
            passive_income: 0,
            last_leak_time: nowIso,
        })
        .select()
        .single();

    if (insertErr) {
        console.error('[Supabase Insert Error]:', insertErr);
    }

    return {
        user: newUser || {
            id: telegramId,
            username: username,
            balance: 0,
            energy: 1000,
            max_energy: 1000,
            click_power: 1,
            passive_income: 0,
        },
        isNewUser: true,
        offlineStats: {
            secondsAway: 0,
            earnedPoints: 0,
        },
    };
};

/**
 * Синхронизация прогресса (тапы, энергия, баланс, бусты) в единую базу
 */
export const syncProgressToServer = async (stats) => {
    const tg = window.Telegram?.WebApp;
    const initData = tg?.initData || 'dev_mode';
    const tgUser = getTelegramUser();
    const telegramId = Number(tgUser.id);

    // 1. Пробуем бэкенд API
    if (API_URL) {
        try {
            const targetUrl = `${API_URL}/api/sync`;
            const response = await fetch(targetUrl, {
                method: 'POST',
                keepalive: true,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `tma ${initData}`,
                },
                body: JSON.stringify(stats),
            });

            if (response.ok) {
                return await response.json();
            }
        } catch {}
    }

    // 2. Прямая синхронизация с Supabase
    if (!telegramId) return;

    const updates = {
        last_leak_time: new Date().toISOString(),
    };

    if (stats.balance !== undefined) updates.balance = Number(stats.balance);
    if (stats.energy !== undefined) updates.energy = Number(stats.energy);
    if (stats.click_power !== undefined) updates.click_power = Number(stats.click_power);
    if (stats.passive_income !== undefined) updates.passive_income = Number(stats.passive_income);
    if (stats.max_energy !== undefined) updates.max_energy = Number(stats.max_energy);

    const { data, error } = await directSupabase
        .from('users')
        .update(updates)
        .eq('id', telegramId)
        .select()
        .single();

    return { success: !error, user: data };
};

/**
 * Создание официальной ссылки на инвойс Telegram Stars (валюта XTR)
 */
export const createStarsInvoiceLink = async (boostId) => {
    const tg = window.Telegram?.WebApp;
    const initData = tg?.initData || 'dev_mode';
    const tgUser = getTelegramUser();
    const telegramId = Number(tgUser.id);

    const boost = STARS_CATALOG[boostId];
    if (!boost) {
        throw new Error('Буст за Stars не найден в каталоге');
    }

    // 1. Пробуем через сервер API
    if (API_URL) {
        try {
            const targetUrl = `${API_URL}/api/stars/create-invoice`;
            const response = await fetch(targetUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `tma ${initData}`,
                },
                body: JSON.stringify({ boostId }),
            });

            if (response.ok) {
                const data = await response.json();
                if (data.invoiceLink) {
                    return {
                        invoiceLink: data.invoiceLink,
                        isTestMode: !!data.isTestMode,
                    };
                }
            }
        } catch {}
    }

    // 2. Официальный прямой вызов Telegram Bot API createInvoiceLink (с CORS *)
    try {
        const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/createInvoiceLink`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title: boost.title,
                description: boost.desc,
                payload: JSON.stringify({ boostId, telegramId, ts: Date.now() }),
                currency: 'XTR',
                prices: [{ label: boost.title, amount: boost.starsPrice }],
                provider_token: '',
            }),
        });

        const data = await response.json();

        if (!data.ok || !data.result) {
            console.error('[Telegram Stars Error]:', data);
            throw new Error(data.description || 'Ошибка Telegram при создании счета на Stars');
        }

        return {
            invoiceLink: data.result,
            isTestMode: false,
        };
    } catch (err) {
        console.error('[CreateStarsInvoiceLink Exception]:', err);
        throw new Error(err.message || 'Не удалось связаться с Telegram Bot API для оплаты Stars');
    }
};

/**
 * Подтверждение оплаты Stars и моментальное начисление буста в базу данных
 */
export const confirmStarsPayment = async (boostId) => {
    const tg = window.Telegram?.WebApp;
    const initData = tg?.initData || 'dev_mode';
    const tgUser = getTelegramUser();
    const telegramId = Number(tgUser.id);

    const boost = STARS_CATALOG[boostId];
    if (!boost) throw new Error('Буст не найден');

    // 1. Пробуем бэкенд
    if (API_URL) {
        try {
            const targetUrl = `${API_URL}/api/stars/confirm`;
            const response = await fetch(targetUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `tma ${initData}`,
                },
                body: JSON.stringify({ boostId }),
            });

            if (response.ok) {
                const data = await response.json();
                if (data.user) return data.user;
            }
        } catch {}
    }

    // 2. Прямое начисление в Supabase
    const { data: user, error: fetchErr } = await directSupabase
        .from('users')
        .select('*')
        .eq('id', telegramId)
        .single();

    if (fetchErr || !user) {
        throw new Error('Не удалось найти профиль игрока в базе');
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

    const { data: updatedUser, error: updateErr } = await directSupabase
        .from('users')
        .update(updates)
        .eq('id', telegramId)
        .select()
        .single();

    if (updateErr) {
        throw updateErr;
    }

    return updatedUser;
};