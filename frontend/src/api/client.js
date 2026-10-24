// frontend/src/api/client.js

// Публичный URL API (относительный путь '' в проде для Vercel или VITE_API_URL при явной настройке)
const API_URL = import.meta.env.VITE_API_URL || '';

/**
 * Авторизация через Telegram WebApp и получение профиля игрока
 */
export const loginWithTelegram = async () => {
    const tg = window.Telegram?.WebApp;
    const initData = tg?.initData || 'dev_mode';
    const targetUrl = `${API_URL}/api/auth`;

    const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `tma ${initData}`,
        },
    });

    if (!response.ok) {
        let errorText = '';
        try {
            const errData = await response.json();
            errorText = errData.error || errData.message || '';
        } catch {
            errorText = `Статус HTTP ${response.status} (${response.statusText})`;
        }
        throw new Error(errorText || `Ошибка сервера (HTTP ${response.status}) при обращении к ${targetUrl}`);
    }

    return await response.json();
};

/**
 * Синхронизация прогресса игрока (баланс, тапы, энергия, бусты) с сервером
 */
export const syncProgressToServer = async (statsOrBalance, maybeEnergy) => {
    const tg = window.Telegram?.WebApp;
    const initData = tg?.initData || 'dev_mode';
    const targetUrl = `${API_URL}/api/sync`;

    const bodyPayload = typeof statsOrBalance === 'object'
        ? statsOrBalance
        : { balance: statsOrBalance, energy: maybeEnergy };

    try {
        const response = await fetch(targetUrl, {
            method: 'POST',
            keepalive: true,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `tma ${initData}`,
            },
            body: JSON.stringify(bodyPayload),
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || `HTTP ${response.status}`);
        }

        return await response.json();
    } catch (err) {
        console.debug('[Sync debug]:', err.message);
        throw err;
    }
};

/**
 * Создание ссылки на инвойс Telegram Stars (валюта XTR) через защищенный бэкенд
 */
export const createStarsInvoiceLink = async (boostId) => {
    const tg = window.Telegram?.WebApp;
    const initData = tg?.initData || 'dev_mode';
    const targetUrl = `${API_URL}/api/stars/create-invoice`;

    const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `tma ${initData}`,
        },
        body: JSON.stringify({ boostId }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(data.error || 'Не удалось создать счет на оплату Telegram Stars');
    }

    return {
        invoiceLink: data.invoiceLink,
        isTestMode: !!data.isTestMode,
        message: data.message,
    };
};

/**
 * Подтверждение оплаты Stars и начисление буста в базу данных на бэкенде
 */
export const confirmStarsPayment = async (boostId) => {
    const tg = window.Telegram?.WebApp;
    const initData = tg?.initData || 'dev_mode';
    const targetUrl = `${API_URL}/api/stars/confirm`;

    const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `tma ${initData}`,
        },
        body: JSON.stringify({ boostId }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(data.error || 'Не удалось начислить буст за Stars');
    }

    return data.user;
};