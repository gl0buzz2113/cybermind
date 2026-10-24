const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const loginWithTelegram = async () => {
    const tg = window.Telegram?.WebApp;
    // Если открыли в браузере на ПК — отправляем 'dev_mode', если в Телеграме — реальную initData
    const initData = tg?.initData || 'dev_mode';
    const targetUrl = `${API_URL}/api/auth`;

    try {
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

            if (response.status === 404) {
                throw new Error(
                    `Бэкенд не найден по адресу: ${targetUrl} (404). Укажите публичный адрес бэкенда в VITE_API_URL на хостинге!`
                );
            }

            if (response.status === 403) {
                throw new Error(
                    errorText || 'Ошибка 403: Неверная подпись Telegram (Invalid hash). Проверьте BOT_TOKEN на бэкенде.'
                );
            }

            throw new Error(errorText || `Ошибка сервера (HTTP ${response.status}) при обращении к ${targetUrl}`);
        }

        return await response.json();
    } catch (err) {
        if (targetUrl.includes('localhost') && !window.location.hostname.includes('localhost')) {
            throw new Error(
                `Фронтенд пытается подключиться к ${targetUrl}. На смартфоне нет бэкенда на localhost! Задеплойте бэкенд и настройте VITE_API_URL.`
            );
        }
        throw err;
    }
};

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
        console.debug('[Sync Failed]:', err.message);
        throw err;
    }
};

/**
 * Создание ссылки на инвойс Telegram Stars через бэкенд
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

    return data.invoiceLink;
};

/**
 * Подтверждение факта оплаты Stars на бэкенде
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