import { create } from 'zustand';

export const useGameStore = create((set, get) => ({
    // Состояние пользователя / игры (старт с 0)
    user: {
        id: null,
        username: 'Оператор',
        balance: 0,
        energy: 1000,
        max_energy: 1000,
        click_power: 1,
        passive_income: 0, // поинтов в секунду (начало без пассивного дохода)
        level: 1,
        level_name: 'LVL 1 CORE',
        energy_regen_rate: 1, // восстановление энергии в сек
    },

    // Активная вкладка навигации ('home' | 'boosts' | 'friends')
    activeTab: 'home',
    setActiveTab: (tab) => set({ activeTab: tab }),

    // Список всплывающих чисел (если рендерится через стор)
    floatingTexts: [],

    // Добавить всплывающую цифру
    addFloatingText: (x, y, value) => {
        const id = `${Date.now()}-${Math.random()}`;
        set((state) => ({
            floatingTexts: [...state.floatingTexts, { id, x, y, value }],
        }));
    },

    // Удалить завершившуюся всплывающую цифру
    removeFloatingText: (id) => {
        set((state) => ({
            floatingTexts: state.floatingTexts.filter((item) => item.id !== id),
        }));
    },

    // Метод клика / тапа по ядру с учетом затрат энергии
    click: (multiplier = 1) => {
        const { user } = get();
        const requiredEnergy = user.click_power * multiplier;

        if (user.energy < 1) {
            return { success: false, earned: 0 };
        }

        // Если энергии меньше чем required, используем сколько можем
        const actualMultiplier = user.energy >= requiredEnergy
            ? multiplier
            : Math.floor(user.energy / user.click_power);

        if (actualMultiplier <= 0) {
            return { success: false, earned: 0 };
        }

        const energySpent = user.click_power * actualMultiplier;
        const pointsEarned = energySpent;

        set((state) => ({
            user: {
                ...state.user,
                balance: Number(state.user.balance) + pointsEarned,
                energy: Math.max(0, state.user.energy - energySpent),
            },
        }));

        return { success: true, earned: pointsEarned, multiplier: actualMultiplier };
    },

    // Ежесекундный игровой цикл: пассивный доход + регенерация энергии
    tick: () => {
        set((state) => {
            const nextBalance = Number(state.user.balance) + (state.user.passive_income || 0);
            const nextEnergy = Math.min(
                state.user.max_energy,
                state.user.energy + (state.user.energy_regen_rate || 1)
            );

            return {
                user: {
                    ...state.user,
                    balance: nextBalance,
                    energy: nextEnergy,
                },
            };
        });
    },

    // Сеттер профиля из бэкенда
    setUser: (userData) => {
        set((state) => ({
            user: {
                ...state.user,
                ...userData,
            },
        }));
    },

    // Ручное обновление баланса
    addBalance: (amount) => {
        set((state) => ({
            user: {
                ...state.user,
                balance: Number(state.user.balance) + amount,
            },
        }));
    },
}));
