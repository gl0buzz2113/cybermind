import { create } from 'zustand';
import { syncProgressToServer, createStarsInvoiceLink, confirmStarsPayment } from '../api/client';

export const LEVEL_TIERS = [
    { level: 1, name: 'КВАНТОВЫЙ ЭМБРИОН', minPoints: 0 },
    { level: 2, name: 'НЕЙРОННЫЙ УЗЕЛ', minPoints: 1000 },
    { level: 3, name: 'КИБЕР-ПРОЦЕССОР', minPoints: 10000 },
    { level: 4, name: 'СЕТЕВОЙ ИНТЕЛЛЕКТ', minPoints: 50000 },
    { level: 5, name: 'КВАНТОВОЕ ЯДРО', minPoints: 200000 },
    { level: 6, name: 'СИНГУЛЯРНОСТЬ', minPoints: 1000000 },
];

export const getLevelInfo = (balance = 0) => {
    let currentTier = LEVEL_TIERS[0];
    for (const tier of LEVEL_TIERS) {
        if (balance >= tier.minPoints) {
            currentTier = tier;
        } else {
            break;
        }
    }
    return currentTier;
};

// Конфигурация бустов за очки (Balance)
export const BASE_BOOSTS = [
    {
        id: 'tap_1',
        title: 'Квантовый тап',
        desc: '+1 к силе каждого тапа',
        type: 'click_power',
        value: 1,
        basePrice: 100,
        priceMultiplier: 1.7,
        icon: 'Zap',
        category: 'points',
    },
    {
        id: 'miner_1',
        title: 'Нейронный поток',
        desc: '+2/сек к пассивному доходу',
        type: 'passive_income',
        value: 2,
        basePrice: 250,
        priceMultiplier: 1.8,
        icon: 'Cpu',
        category: 'points',
    },
    {
        id: 'tap_2',
        title: 'Разгон частоты ядра',
        desc: '+5 к силе каждого тапа',
        type: 'click_power',
        value: 5,
        basePrice: 1200,
        priceMultiplier: 2.0,
        icon: 'Flame',
        category: 'points',
    },
    {
        id: 'miner_2',
        title: 'Суперкомпьютерный кластер',
        desc: '+15/сек к пассивному доходу',
        type: 'passive_income',
        value: 15,
        basePrice: 5000,
        priceMultiplier: 2.2,
        icon: 'Server',
        category: 'points',
    },
    {
        id: 'energy_cap',
        title: 'Квантовый конденсатор',
        desc: '+500 к максимальной энергии ядра',
        type: 'max_energy',
        value: 500,
        basePrice: 2500,
        priceMultiplier: 2.5,
        icon: 'BatteryCharging',
        category: 'points',
    },
    {
        id: 'miner_3',
        title: 'Автономный ИИ-Синдикат',
        desc: '+50/сек к пассивному доходу',
        type: 'passive_income',
        value: 50,
        basePrice: 25000,
        priceMultiplier: 2.5,
        icon: 'TrendingUp',
        category: 'points',
    },
];

// Конфигурация супер-бустов за Telegram Stars (⭐)
export const STARS_BOOSTS = [
    {
        id: 'stars_tap_super',
        title: 'Сингулярный Чип ИИ',
        desc: 'Мгновенно +50 к силе тапа навсегда',
        type: 'click_power',
        value: 50,
        starsPrice: 25,
        icon: 'Sparkles',
        badge: 'TOP TAP',
    },
    {
        id: 'stars_miner_super',
        title: 'Квантовый Майнер-Синдикат',
        desc: '+150/сек к пассивному доходу навсегда (+540 000 в час!)',
        type: 'passive_income',
        value: 150,
        starsPrice: 50,
        icon: 'Rocket',
        badge: 'SUPER FARM',
    },
    {
        id: 'stars_energy_super',
        title: 'Бесконечный Реактор',
        desc: '+5000 к макс. энергии и регенерация x5',
        type: 'special_energy',
        value: 5000,
        starsPrice: 75,
        icon: 'Shield',
        badge: 'UNLIMITED',
    },
];

const getStorageKey = (userId) => `cw_clicker_save_${userId || 'default'}`;

const loadLocalData = (userId) => {
    try {
        const saved = localStorage.getItem(getStorageKey(userId));
        if (saved) {
            return JSON.parse(saved);
        }
    } catch {}
    return null;
};

const saveLocalData = (user, boostLevels) => {
    try {
        localStorage.setItem(
            getStorageKey(user.id),
            JSON.stringify({
                user,
                boostLevels,
            })
        );
    } catch {}
};

// Безопасный виброотклик Telegram
const triggerHaptic = (type = 'light') => {
    try {
        if (type === 'success') {
            window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success');
        } else if (type === 'warning') {
            window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('warning');
        } else {
            window.Telegram?.WebApp?.HapticFeedback?.impactOccurred(type);
        }
    } catch {}
};

export const useGameStore = create((set, get) => {
    const cached = loadLocalData(null);
    const initialBalance = Number(cached?.user?.balance || 0);
    const initialTier = getLevelInfo(initialBalance);

    return {
        // Состояние пользователя
        user: {
            id: cached?.user?.id || null,
            username: cached?.user?.username || 'Оператор',
            balance: initialBalance,
            energy: Number(cached?.user?.energy ?? 1000),
            max_energy: Number(cached?.user?.max_energy || 1000),
            click_power: Number(cached?.user?.click_power || 1),
            passive_income: Number(cached?.user?.passive_income || 0),
            level: initialTier.level,
            level_name: initialTier.name,
            energy_regen_rate: Number(cached?.user?.energy_regen_rate || 1),
        },

        // Уровни купленных бустов: { [boostId]: number }
        boostLevels: cached?.boostLevels || {},

        // Активная вкладка навигации ('home' | 'boosts' | 'friends')
        activeTab: 'home',
        setActiveTab: (tab) => set({ activeTab: tab }),

        // Всплывающие цифры тапов
        floatingTexts: [],
        addFloatingText: (x, y, value) => {
            const id = `${Date.now()}-${Math.random()}`;
            set((state) => ({
                floatingTexts: [...state.floatingTexts, { id, x, y, value }],
            }));
        },
        removeFloatingText: (id) => {
            set((state) => ({
                floatingTexts: state.floatingTexts.filter((item) => item.id !== id),
            }));
        },

        // Расчет стоимости буста с учетом текущего уровня
        getBoostPrice: (boostId) => {
            const { boostLevels } = get();
            const config = BASE_BOOSTS.find((b) => b.id === boostId);
            if (!config) return 0;

            const currentLvl = boostLevels[boostId] || 0;
            return Math.floor(config.basePrice * Math.pow(config.priceMultiplier, currentLvl));
        },

        // Покупка буста за поинты (баланс)
        buyBoost: (boostId) => {
            const { user, boostLevels, getBoostPrice } = get();
            const config = BASE_BOOSTS.find((b) => b.id === boostId);
            if (!config) return { success: false, reason: 'Буст не найден' };

            const price = getBoostPrice(boostId);
            if (user.balance < price) {
                triggerHaptic('warning');
                return { success: false, reason: 'Недостаточно очков баланса' };
            }

            const currentLvl = (boostLevels[boostId] || 0) + 1;
            const nextBalance = user.balance - price;

            let nextClickPower = user.click_power;
            let nextPassiveIncome = user.passive_income;
            let nextMaxEnergy = user.max_energy;
            let nextEnergy = user.energy;

            if (config.type === 'click_power') {
                nextClickPower += config.value;
            } else if (config.type === 'passive_income') {
                nextPassiveIncome += config.value;
            } else if (config.type === 'max_energy') {
                nextMaxEnergy += config.value;
                nextEnergy = Math.min(nextMaxEnergy, nextEnergy + config.value);
            }

            // Пересчитываем ранг ИИ
            const tier = getLevelInfo(nextBalance);

            const nextUser = {
                ...user,
                balance: nextBalance,
                click_power: nextClickPower,
                passive_income: nextPassiveIncome,
                max_energy: nextMaxEnergy,
                energy: nextEnergy,
                level: tier.level,
                level_name: tier.name,
            };

            const nextBoostLevels = {
                ...boostLevels,
                [boostId]: currentLvl,
            };

            saveLocalData(nextUser, nextBoostLevels);
            set({ user: nextUser, boostLevels: nextBoostLevels });

            triggerHaptic('success');

            // Мгновенно синхронизируем с бэкендом
            if (nextUser.id) {
                syncProgressToServer({
                    balance: nextUser.balance,
                    energy: nextUser.energy,
                    click_power: nextUser.click_power,
                    passive_income: nextUser.passive_income,
                    max_energy: nextUser.max_energy,
                }).catch(() => {});
            }

            return { success: true, level: currentLvl };
        },

        // Покупка премиум-буста за Telegram Stars (⭐)
        buyStarsBoost: async (boostId) => {
            const { user } = get();
            const config = STARS_BOOSTS.find((b) => b.id === boostId);
            if (!config) return { success: false, reason: 'Буст не найден' };

            const tg = window.Telegram?.WebApp;

            // Если не в Telegram — предлагаем симуляцию для тестирования
            if (!tg || !tg.openInvoice) {
                const proceedBrowser = window.confirm(
                    `⭐ Нативная оплата Telegram Stars (шторка оплаты) работает внутри Telegram.\n\nВы открыли проект в обычном браузере. Активировать "${config.title}" в режиме симулятора?`
                );
                if (!proceedBrowser) return { success: false, reason: 'Только в приложении Telegram' };
                const updatedUser = await confirmStarsPayment(boostId);
                if (updatedUser) {
                    get().setUser(updatedUser);
                }
                triggerHaptic('success');
                alert(`✨ Буст "${config.title}" успешно применен!`);
                return { success: true };
            }

            try {
                // 1. Создаем ссылку на инвойс Stars через Telegram Bot API
                const invoiceData = await createStarsInvoiceLink(boostId);

                // Если бэкенд в тестовом режиме (BOT_TOKEN еще не указан в backend/.env)
                if (invoiceData.isTestMode) {
                    const confirmTest = window.confirm(
                        `⭐ Внимание: На бэкенде еще не указан реальный BOT_TOKEN от @BotFather (настоящее списание Stars недоступно).\n\nХотите активировать "${config.title}" в тестовом режиме для проверки?`
                    );
                    if (!confirmTest) return { success: false, reason: 'Отменено' };

                    const updatedUser = await confirmStarsPayment(boostId);
                    if (updatedUser) {
                        get().setUser(updatedUser);
                    }
                    triggerHaptic('success');
                    alert(`✨ Тестовый буст "${config.title}" успешно активирован!`);
                    return { success: true };
                }

                // 2. Открываем нативную шторку оплаты Telegram Stars
                return new Promise((resolve) => {
                    tg.openInvoice(invoiceData.invoiceLink, async (status) => {
                        if (status === 'paid') {
                            // Оплата реально списана в Telegram!
                            triggerHaptic('success');
                            try {
                                const updatedUser = await confirmStarsPayment(boostId);
                                if (updatedUser) {
                                    get().setUser(updatedUser);
                                }
                                alert(`✨ Успешно! Буст "${config.title}" активирован за ${config.starsPrice} ⭐!`);
                                resolve({ success: true });
                            } catch (err) {
                                alert(`Ошибка активации: ${err.message}`);
                                resolve({ success: false, error: err.message });
                            }
                        } else if (status === 'cancelled') {
                            triggerHaptic('warning');
                            resolve({ success: false, reason: 'Оплата отменена' });
                        } else {
                            triggerHaptic('warning');
                            alert(`Оплата Stars не завершена (статус: ${status})`);
                            resolve({ success: false, status });
                        }
                    });
                });
            } catch (err) {
                triggerHaptic('warning');
                alert(err.message || 'Не удалось открыть счет Telegram Stars');
                return { success: false, error: err.message };
            }
        },

        // Накопленная локальная дельта кликов за последние 3 секунды для отправки в RPC
        localDelta: 0,

        consumeDelta: () => {
            const delta = get().localDelta;
            set({ localDelta: 0 });
            return delta;
        },

        restoreDelta: (delta) => {
            if (delta > 0) {
                set((state) => ({ localDelta: state.localDelta + delta }));
            }
        },

        // Жестко применить авторитетный баланс из базы (с сохранением любых новых кликов, сделанных во время запроса)
        applyAuthoritativeBalance: (serverBalance) => {
            set((state) => {
                const authoritativeNum = Number(serverBalance);
                if (!Number.isFinite(authoritativeNum)) return {};

                // Отображаемый баланс = подтвержденная база + дельта текущего 3-сек интервала
                const newDisplayBalance = authoritativeNum + state.localDelta;
                const tier = getLevelInfo(newDisplayBalance);

                const nextUser = {
                    ...state.user,
                    balance: newDisplayBalance,
                    level: tier.level,
                    level_name: tier.name,
                };

                saveLocalData(nextUser, state.boostLevels);
                return { user: nextUser };
            });
        },

        // Клик по ядру
        click: (multiplier = 1) => {
            const { user, boostLevels } = get();
            const requiredEnergy = user.click_power * multiplier;

            if (user.energy < 1) {
                return { success: false, earned: 0 };
            }

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

            // Пересчитываем уровень при клике
            const tier = getLevelInfo(nextBalance);

            const updatedUser = {
                ...user,
                balance: nextBalance,
                energy: nextEnergy,
                level: tier.level,
                level_name: tier.name,
            };

            saveLocalData(updatedUser, boostLevels);
            set((state) => ({
                user: updatedUser,
                localDelta: state.localDelta + pointsEarned,
            }));

            return { success: true, earned: pointsEarned, multiplier: actualMultiplier };
        },

        // Ежесекундный игровой цикл: пассивный доход + регенерация энергии
        tick: () => {
            const { user, boostLevels } = get();
            const passiveEarned = Number(user.passive_income || 0);
            const nextBalance = Number(user.balance) + passiveEarned;
            const nextEnergy = Math.min(
                user.max_energy,
                user.energy + (user.energy_regen_rate || 1)
            );

            const tier = getLevelInfo(nextBalance);

            const updatedUser = {
                ...user,
                balance: nextBalance,
                energy: nextEnergy,
                level: tier.level,
                level_name: tier.name,
            };

            saveLocalData(updatedUser, boostLevels);
            set((state) => ({
                user: updatedUser,
                localDelta: state.localDelta + passiveEarned,
            }));
        },

        // Сеттер профиля из бэкенда (единый источник истины для кроссплатформенного аккаунта)
        setUser: (userData) => {
            set((state) => {
                const targetUserId = userData.id || state.user.id;

                const serverBalance = Number(userData.balance ?? 0);
                const localBalance = Number(state.user.balance || 0);
                // Защита от сброса прогресса в 0 при повторном входе
                const authoritativeBalance = Math.max(serverBalance, localBalance);

                const serverClickPower = Number(userData.click_power || state.user.click_power || 1);
                const serverPassiveIncome = Number(userData.passive_income ?? state.user.passive_income ?? 0);
                const serverMaxEnergy = Number(userData.max_energy || state.user.max_energy || 1000);
                const serverEnergy = Number(userData.energy ?? state.user.energy ?? serverMaxEnergy);

                const tier = getLevelInfo(authoritativeBalance);

                const nextUser = {
                    ...state.user,
                    ...userData,
                    id: targetUserId,
                    balance: authoritativeBalance,
                    click_power: serverClickPower,
                    passive_income: serverPassiveIncome,
                    max_energy: serverMaxEnergy,
                    energy: serverEnergy,
                    level: tier.level,
                    level_name: tier.name,
                };

                // Синхронизируем локальный кэш устройства с единой базой
                saveLocalData(nextUser, state.boostLevels);

                return { user: nextUser };
            });
        },
    };
});
