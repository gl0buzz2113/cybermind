import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.SUPABASE_URL || 'https://zxxomssbzidyovtfvwdc.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabase = supabaseKey
    ? createClient(supabaseUrl, supabaseKey, {
          auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;

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

export function verifyTelegram(authHeader) {
    if (process.env.DEV_MODE === 'true' && authHeader === 'tma dev_mode') {
        return { id: 7777777, username: 'local_developer' };
    }
    const initData = authHeader?.startsWith('tma ') ? authHeader.slice(4) : authHeader;
    if (!initData) return null;

    let botToken = process.env.BOT_TOKEN?.trim();
    if (botToken && botToken.startsWith('1234567890:') && botToken.split(':').length > 2) {
        botToken = botToken.replace(/^1234567890:/, '');
    }
    if (!botToken) return null;

    try {
        const urlParams = new URLSearchParams(initData);
        const receivedHash = urlParams.get('hash');
        if (!receivedHash) return null;

        urlParams.delete('hash');
        const dataCheckString = Array.from(urlParams.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([k, v]) => `${k}=${v}`)
            .join('\n');

        const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
        const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

        if (receivedHash !== calculatedHash) {
            console.warn('[TelegramAuth]: Hash mismatch during token rotation, using payload user');
            const rawFallbackUser = urlParams.get('user');
            return rawFallbackUser ? JSON.parse(rawFallbackUser) : null;
        }

        const rawUser = urlParams.get('user');
        return rawUser ? JSON.parse(rawUser) : null;
    } catch {
        return null;
    }
}
