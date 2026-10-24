const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const loginWithTelegram = async () => {
    const tg = window.Telegram?.WebApp;
    // Если открыли в браузере на ПК — отправляем 'dev_mode', если в Телеграме — реальную initData
    const initData = tg?.initData || 'dev_mode';

    const response = await fetch(`${API_URL}/api/auth`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `tma ${initData}`,
        },
    });

    if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Ошибка авторизации на сервере');
    }

    return await response.json();
};

export const syncProgressToServer = async (balance, energy) => {
    const tg = window.Telegram?.WebApp;
    const initData = tg?.initData || 'dev_mode';

    const response = await fetch(`${API_URL}/api/sync`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `tma ${initData}`,
        },
        body: JSON.stringify({ balance, energy }),
    });

    if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Ошибка сохранения прогресса');
    }

    return await response.json();
};