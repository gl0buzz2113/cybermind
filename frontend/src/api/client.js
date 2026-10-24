const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const loginWithTelegram = async () => {
    const tg = window.Telegram?.WebApp;
    // Если открыли в браузеру на ПК — отправляем 'dev_mode', если в Телеграме — реальную initData
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
        if (targetUrl.includes('localhost')) {
            throw new Error(
                `Фронтенд пытается подключиться к ${targetUrl}. На смартфоне нет бэкенда на localhost! Задеплойте бэкенд и настройте VITE_API_URL.`
            );
        }
        throw err;
    }
};

export const syncProgressToServer = async (balance, energy) => {
    const tg = window.Telegram?.WebApp;
    const initData = tg?.initData || 'dev_mode';
    const targetUrl = `${API_URL}/api/sync`;

    try {
        const response = await fetch(targetUrl, {
            method: 'POST',
            keepalive: true,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `tma ${initData}`,
            },
            body: JSON.stringify({ balance, energy }),
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