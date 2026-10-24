import { supabase, STARS_CATALOG, verifyTelegram } from '../_shared.js';

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

    const { boostId } = req.body || {};
    const boost = STARS_CATALOG[boostId];
    if (!boost) {
        return res.status(404).json({ error: 'Буст за Stars не найден' });
    }

    const telegramId = Number(tgUser.id);

    try {
        const { data: user, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('id', telegramId)
            .single();

        if (fetchError || !user) {
            return res.status(404).json({ error: 'Игрок не найден в базе' });
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

        if (updateError) throw updateError;

        return res.status(200).json({ success: true, user: updatedUser });
    } catch (err) {
        return res.status(500).json({ error: 'Не удалось активировать буст за Stars' });
    }
}
