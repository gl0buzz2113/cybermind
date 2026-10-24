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
        return res.status(500).json({ error: 'SUPABASE_SERVICE_ROLE_KEY не задан в переменных окружения' });
    }

    const telegramId = Number(tgUser.id);
    const username = tgUser.username || tgUser.first_name || `agent_${telegramId}`;
    const now = new Date();

    try {
        const { data: existingUser } = await supabase
            .from('users')
            .select('*')
            .eq('id', telegramId)
            .maybeSingle();

        if (existingUser) {
            const passiveIncome = Number(existingUser.passive_income || 0);
            const lastLeak = existingUser.last_leak_time ? new Date(existingUser.last_leak_time).getTime() : now.getTime();
            const elapsed = Math.max(0, Math.floor((now.getTime() - (isNaN(lastLeak) ? now.getTime() : lastLeak)) / 1000));
            const effective = Math.min(elapsed, 3 * 3600);
            const offlineEarned = effective * passiveIncome;

            const maxE = Number(existingUser.max_energy || 1000);
            const curE = Number(existingUser.energy ?? maxE);
            const newEnergy = Math.min(maxE, curE + elapsed);
            const newBalance = Number(existingUser.balance || 0) + offlineEarned;

            const { data: updatedUser } = await supabase
                .from('users')
                .update({
                    username,
                    balance: newBalance,
                    energy: newEnergy,
                    last_leak_time: now.toISOString(),
                })
                .eq('id', telegramId)
                .select()
                .single();

            return res.status(200).json({
                user: updatedUser || existingUser,
                isNewUser: false,
                offlineStats: { secondsAway: elapsed, earnedPoints: offlineEarned },
            });
        }

        const { data: newUser, error: insertError } = await supabase
            .from('users')
            .insert({
                id: telegramId,
                username,
                balance: 0,
                energy: 1000,
                max_energy: 1000,
                click_power: 1,
                passive_income: 0,
                last_leak_time: now.toISOString(),
            })
            .select()
            .single();

        if (insertError) throw insertError;

        return res.status(201).json({
            user: newUser,
            isNewUser: true,
            offlineStats: { secondsAway: 0, earnedPoints: 0 },
        });
    } catch (err) {
        console.error('[API Auth Error]:', err);
        return res.status(500).json({ error: 'Ошибка сохранения в базу данных' });
    }
}
