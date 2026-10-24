import { supabase, verifyTelegram } from './_shared.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const tgUser = verifyTelegram(req.headers.authorization);
    const body = req.body || {};
    const telegramId = Number(tgUser?.id || body.user_id_param);

    if (!telegramId) {
        return res.status(401).json({ error: 'Ошибка проверки авторизации Telegram' });
    }

    if (!supabase) {
        return res.status(500).json({ error: 'База данных не настроена' });
    }

    // 1. Атомарный инкремент баланса через RPC increment_balance
    if (body.delta_param !== undefined || body.rpc === 'increment_balance') {
        const delta = Number(body.delta_param || 0);

        try {
            const { data, error } = await supabase.rpc('increment_balance', {
                user_id_param: String(telegramId),
                delta_param: delta,
            });

            if (!error && data) {
                const bal = data.balance ?? (typeof data === 'number' ? data : null);
                return res.status(200).json({ success: true, data: { balance: Number(bal ?? 0) } });
            }

            // Запасной вариант, если RPC еще не создана в Supabase
            const { data: user } = await supabase.from('users').select('balance').eq('id', telegramId).maybeSingle();
            const currentBal = Number(user?.balance || 0);
            const newBal = currentBal + delta;
            await supabase.from('users').update({ balance: newBal, last_leak_time: new Date().toISOString() }).eq('id', telegramId);

            return res.status(200).json({ success: true, data: { balance: newBal } });
        } catch (err) {
            console.error('[Sync RPC Error]:', err);
            return res.status(500).json({ error: err.message || 'Ошибка RPC increment_balance' });
        }
    }

    // 2. Стандартное сохранение состояния пользователя
    const updates = {
        last_leak_time: new Date().toISOString(),
    };

    if (body.balance !== undefined) updates.balance = Number(body.balance);
    if (body.energy !== undefined) updates.energy = Number(body.energy);
    if (body.click_power !== undefined) updates.click_power = Number(body.click_power);
    if (body.passive_income !== undefined) updates.passive_income = Number(body.passive_income);
    if (body.max_energy !== undefined) updates.max_energy = Number(body.max_energy);

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
