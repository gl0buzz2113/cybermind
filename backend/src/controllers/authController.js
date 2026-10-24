import { supabase } from '../config/supabase.js';

// Константы игрового баланса
const MAX_OFFLINE_SECONDS = 3 * 60 * 60; // Ограничиваем офлайн-фарм 3 часами (как в Hamster Kombat)
const ENERGY_REGEN_PER_SEC = 1;          // Базовая скорость регенерации энергии в секунду
const REFERRAL_WELCOME_BONUS = 5000;     // Бонус поинтов за вход по рефералке

export const authenticateUser = async (req, res) => {
    try {
        const tgUser = req.telegramUser;
        const startParam = req.startParam;
        const telegramId = Number(tgUser.id);
        const username = tgUser.username || tgUser.first_name || `user_${telegramId}`;

        // 1. Ищем пользователя в базе (maybeSingle не кидает ошибку, если запись не найдена)
        const { data: existingUser, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('id', telegramId)
            .maybeSingle();

        if (fetchError) {
            throw fetchError;
        }

        const now = new Date();

        // =========================================================================
        // СЦЕНАРИЙ А: Пользователь уже существует -> считаем офлайн-доход и энергию
        // =========================================================================
        if (existingUser) {
            const passiveIncome = Number(existingUser.passive_income || 0);
            const lastLeakDate = existingUser.last_leak_time ? new Date(existingUser.last_leak_time) : now;
            const validLeakTime = Number.isFinite(lastLeakDate.getTime()) ? lastLeakDate.getTime() : now.getTime();
            const elapsedSeconds = Math.max(0, Math.floor((now.getTime() - validLeakTime) / 1000));

            // Ограничиваем время офлайн-дохода (например, максимум 3 часа)
            const effectiveOfflineSeconds = Math.min(elapsedSeconds, MAX_OFFLINE_SECONDS);

            // Считаем сколько нафармил пассивный доход
            const offlineEarned = effectiveOfflineSeconds * passiveIncome;

            // Считаем сколько восстановилось энергии
            const regeneratedEnergy = elapsedSeconds * ENERGY_REGEN_PER_SEC;
            const maxEnergy = Number(existingUser.max_energy || 1000);
            const currentEnergy = Number(existingUser.energy ?? maxEnergy);
            const newEnergy = Math.min(
                maxEnergy,
                currentEnergy + regeneratedEnergy
            );

            const newBalance = Number(existingUser.balance || 0) + offlineEarned;

            // Обновляем данные пользователя в БД и актуализируем last_leak_time
            const { data: updatedUser, error: updateError } = await supabase
                .from('users')
                .update({
                    username, // Обновляем на случай, если юзер сменил ник в ТГ
                    balance: newBalance,
                    energy: newEnergy,
                    last_leak_time: now.toISOString(),
                })
                .eq('id', telegramId)
                .select()
                .single();

            if (updateError) {
                throw updateError;
            }

            return res.status(200).json({
                user: updatedUser,
                isNewUser: false,
                offlineStats: {
                    secondsAway: elapsedSeconds,
                    earnedPoints: offlineEarned,
                },
            });
        }

        // =========================================================================
        // СЦЕНАРИЙ Б: Новый пользователь -> проверяем реферала и создаем запись
        // =========================================================================
        let validReferrerId = null;
        let initialBalance = 0;

        if (startParam) {
            // Очищаем префикс 'ref_', если ссылка вида ?startapp=ref_123456789
            const cleanParam = startParam.replace(/^ref_/i, '');
            const parsedReferrerId = Number(cleanParam);

            // Проверяем, что это число и юзер не пытается пригласить сам себя
            if (!Number.isNaN(parsedReferrerId) && parsedReferrerId > 0 && parsedReferrerId !== telegramId) {
                // Проверяем, существует ли такой реферер в нашей БД
                const { data: referrerUser } = await supabase
                    .from('users')
                    .select('id, balance')
                    .eq('id', parsedReferrerId)
                    .maybeSingle();

                if (referrerUser) {
                    validReferrerId = referrerUser.id;
                    initialBalance = REFERRAL_WELCOME_BONUS;

                    // Начисляем бонус пригласившему игроку
                    await supabase
                        .from('users')
                        .update({ balance: Number(referrerUser.balance) + REFERRAL_WELCOME_BONUS })
                        .eq('id', validReferrerId);
                }
            }
        }

        // Создаем нового игрока
        const { data: newUser, error: insertError } = await supabase
            .from('users')
            .insert({
                id: telegramId,
                username: username,
                balance: initialBalance,
                energy: 1000,
                max_energy: 1000,
                click_power: 1,
                passive_income: 0,
                referrer_id: validReferrerId,
                last_leak_time: now.toISOString(),
            })
            .select()
            .single();

        if (insertError) {
            throw insertError;
        }

        return res.status(201).json({
            user: newUser,
            isNewUser: true,
            offlineStats: {
                secondsAway: 0,
                earnedPoints: 0,
            },
        });
    } catch (error) {
        console.error('[AuthController Error]:', error);
        return res.status(500).json({ error: 'Ошибка при синхронизации профиля игрока' });
    }
};