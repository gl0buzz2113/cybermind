import { supabase } from '../config/supabase.js';

/**
 * Синхронизация игрового прогресса (баланс, энергия, бусты, клики, пассивный доход) с Supabase
 */
export const syncProgress = async (req, res) => {
    try {
        const telegramId = Number(req.telegramUser?.id);
        const { balance, energy, click_power, passive_income, max_energy } = req.body;

        if (!telegramId) {
            return res.status(401).json({ error: 'Пользователь не авторизован' });
        }

        if (balance === undefined || energy === undefined) {
            return res.status(400).json({ error: 'Параметры balance и energy обязательны' });
        }

        const now = new Date();

        // Формируем объект обновлений
        const updatePayload = {
            balance: Math.max(0, Number(balance)),
            energy: Math.max(0, Number(energy)),
            last_leak_time: now.toISOString(),
        };

        if (click_power !== undefined && Number(click_power) > 0) {
            updatePayload.click_power = Number(click_power);
        }

        if (passive_income !== undefined && Number(passive_income) >= 0) {
            updatePayload.passive_income = Number(passive_income);
        }

        if (max_energy !== undefined && Number(max_energy) > 0) {
            updatePayload.max_energy = Number(max_energy);
        }

        const { data: updatedUser, error } = await supabase
            .from('users')
            .update(updatePayload)
            .eq('id', telegramId)
            .select()
            .single();

        if (error) {
            throw error;
        }

        return res.status(200).json({
            success: true,
            user: updatedUser,
        });
    } catch (error) {
        console.error('[SyncProgress Error]:', error);
        return res.status(500).json({ error: 'Не удалось синхронизировать прогресс' });
    }
};
