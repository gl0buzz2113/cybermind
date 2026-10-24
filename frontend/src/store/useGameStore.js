import { create } from 'zustand';

const STORAGE_KEY = 'cw_studio_clicker_save';

// Загрузка сохраненного прогресса из localStorage при старте
const getInitialUser = () => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            return {
                id: parsed.id || null,
                username: parsed.username || 'Оператор',
                balance: Number(parsed.balance || 0),
                energy: Number(parsed.energy ?? 1000),
                max_energy: Number(parsed.max_energy || 1000),
                click_power: Number(parsed.click_power || 1),
                passive_income: Number(parsed.passive_income || 0),
                level: Number(parsed.level || 1),
                level_name: parsed.level_name || 'LVL 1 CORE',
                energy_regen_rate: Number(parsed.energy_regen_rate || 1),
            };
        }
    } catch (e) {
        console.debug('[Storage Load Error]:', e);
    }

    return {
        id: null,
        username: 'Оператор',
        balance: 0,
        energy: 1000,
        max_energy: 1000,
        click_power: 1,
        passive_income: 0,
        level: 1,
        level_name: 'LVL 1 CORE',
        energy_regen_rate: 1,
    };
};

// Сохранение в localStorage для мгновенного сохранения
const saveToLocalStorage = (user) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } catch (e) {
        console.debug('[Storage Save Error]:', e);
    }
};

export const useGameStore = create((set, get) => ({
    // Состояние пользователя / игры
    user: getInitialUser(),

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

        const nextBalance = Number(user.balance) + pointsEarned;
        const nextEnergy = Math.max(0, user.energy - energySpent);

        const updatedUser = {
            ...user,
            balance: nextBalance,
            energy: nextEnergy,
        };

        saveToLocalStorage(updatedUser);

        set({ user: updatedUser });

        return { success: true, earned: pointsEarned, multiplier: actualMultiplier };
    },

    // Ежесекундный игровой цикл: пассивный доход + регенерация энергии
    tick: () => {
        const { user } = get();
        const nextBalance = Number(user.balance) + (user.passive_income || 0);
        const nextEnergy = Math.min(
            user.max_energy,
            user.energy + (user.energy_regen_rate || 1)
        );

        const updatedUser = {
            ...user,
            balance: nextBalance,
            energy: nextEnergy,
        };

        // Сохраняем в localStorage
        saveToLocalStorage(updatedUser);

        set({ user: updatedUser });
    },

    // Сеттер профиля из бэкенда (с защитой от сброса прогресса)
    setUser: (userData) => {
        set((state) => {
            // Если локальный баланс больше серверного (сервер не успел получить последний клик перед выходом),
            // оставляем максимальный, чтобы игрок никогда не терял поинты
            const finalBalance = Math.max(
                Number(userData.balance ?? 0),
                Number(state.user.balance ?? 0)
            );

            const updatedUser = {
                ...state.user,
                ...userData,
                balance: finalBalance,
            };

            saveToLocalStorage(updatedUser);
            return { user: updatedUser };
        });
    },

    // Ручное обновление баланса
    addBalance: (amount) => {
        set((state) => {
            const updatedUser = {
                ...state.user,
                balance: Number(state.user.balance) + amount,
            };
            saveToLocalStorage(updatedUser);
            return { user: updatedUser };
        });
    },
}));
