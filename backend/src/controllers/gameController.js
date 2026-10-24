import { supabase } from '../config/supabase.js';

/**
 * Синхронизация игрового прогресса (баланс, энергия, бусты, клики, пассивный доход) с Supabase
 */
export const syncProgress = async (req, res) => {
    try {
        const telegramId = Number(req.telegramUser?.id || req.body?.user_id_param);
        const { delta_param, rpc, balance, energy, click_power, passive_income, max_energy } = req.body || {};

        if (!telegramId) {
            return res.status(401).json({ error: 'Пользователь не авторизован' });
        }

        // 1. Атомарный инкремент баланса через RPC increment_balance
        if (delta_param !== undefined || rpc === 'increment_balance') {
            const delta = Number(delta_param || 0);

            try {
                const { data, error } = await supabase.rpc('increment_balance', {
                    user_id_param: String(telegramId),
                    delta_param: delta,
                });

                if (!error && data) {
                    const bal = data.balance ?? (typeof data === 'number' ? data : null);
                    return res.status(200).json({ success: true, data: { balance: Number(bal ?? 0) } });
                }

                // Запасной вариант на случай, если RPC в Supabase еще не создана
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

        // 2. Стандартная полная синхронизация
        const now = new Date();
        const updatePayload = {
            last_leak_time: now.toISOString(),
        };

        if (balance !== undefined) updatePayload.balance = Math.max(0, Number(balance));
        if (energy !== undefined) updatePayload.energy = Math.max(0, Number(energy));
        if (click_power !== undefined && Number(click_power) > 0) updatePayload.click_power = Number(click_power);
        if (passive_income !== undefined && Number(passive_income) >= 0) updatePayload.passive_income = Number(passive_income);
        if (max_energy !== undefined && Number(max_energy) > 0) updatePayload.max_energy = Number(max_energy);

        const { data: updatedUser, error } = await supabase
            .from('users')
            .update(updatePayload)
            .eq('id', telegramId)
            .select()
            .single();

        if (error) throw error;

        return res.status(200).json({
            success: true,
            user: updatedUser,
        });
    } catch (error) {
        console.error('[SyncProgress Error]:', error);
        return res.status(500).json({ error: 'Не удалось синхронизировать прогресс' });
    }
};
