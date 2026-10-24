import { supabase } from '../config/supabase.js';

/**
 * Синхронизация игрового прогресса (баланс и энергия) с базой данных Supabase
 */
export const syncProgress = async (req, res) => {
    try {
        const telegramId = Number(req.telegramUser?.id);
        const { balance, energy } = req.body;

        if (!telegramId) {
            return res.status(401).json({ error: 'Пользователь не авторизован' });
        }

        if (balance === undefined || energy === undefined) {
            return res.status(400).json({ error: 'Параметры balance и energy обязательны' });
        }

        const now = new Date();

        const { data: updatedUser, error } = await supabase
            .from('users')
            .update({
                balance: Math.max(0, Number(balance)),
                energy: Math.max(0, Number(energy)),
                last_leak_time: now.toISOString(),
            })
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
