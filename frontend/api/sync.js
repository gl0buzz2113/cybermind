import { supabase, verifyTelegram } from './_shared.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const tgUser = verifyTelegram(req.headers.authorization);
    if (!tgUser) {
        return res.status(401).json({ error: 'Ошибка проверки авторизации Telegram' });
    }

    if (!supabase) {
        return res.status(500).json({ error: 'База данных не настроена' });
    }

    const telegramId = Number(tgUser.id);
    const stats = req.body || {};

    const updates = {
        last_leak_time: new Date().toISOString(),
    };

    if (stats.balance !== undefined) updates.balance = Number(stats.balance);
    if (stats.energy !== undefined) updates.energy = Number(stats.energy);
    if (stats.click_power !== undefined) updates.click_power = Number(stats.click_power);
    if (stats.passive_income !== undefined) updates.passive_income = Number(stats.passive_income);
    if (stats.max_energy !== undefined) updates.max_energy = Number(stats.max_energy);

    try {
        const { data: updatedUser, error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', telegramId)
            .select()
            .single();

        if (error) throw error;

        return res.status(200).json({ success: true, user: updatedUser });
    } catch (err) {
        return res.status(500).json({ error: err.message || 'Ошибка синхронизации' });
    }
}
