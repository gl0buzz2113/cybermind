import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Terminal, Flame, TrendingUp, ShieldCheck } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';
import { ClickerZone } from '../components/game/ClickerZone';
import { EnergyBar } from '../components/game/EnergyBar';
import { FloatingText } from '../components/game/FloatingText';
import { BottomNav } from '../components/layout/BottomNav';
import { syncProgressToServer } from '../api/client';

/**
 * HomePage - Главный экран ИИ-кликера.
 * Объединяет:
 * - Хедер: плашка студии, уровень ИИ, никнейм, пассивный доход
 * - Большой неоновый счетчик баланса
 * - Интерактивную клик-зону (ClickerZone) с ядром ИИ
 * - Анимированные вылетающие цифры (FloatingText)
 * - Индикатор энергии (EnergyBar)
 * - Нижнюю навигацию (BottomNav)
 * - Ежесекундный игровой тикер tick() для пассивного майнинга и регенерации
 * - Фоновое сохранение прогресса на сервер
 */
export const HomePage = () => {
    const user = useGameStore((state) => state.user);
    const tick = useGameStore((state) => state.tick);
    const activeTab = useGameStore((state) => state.activeTab);

    // Запуск игрового цикла (тикера) каждую 1 секунду
    useEffect(() => {
        const intervalId = setInterval(() => {
            tick();
        }, 1000);

        return () => clearInterval(intervalId);
    }, [tick]);

    // Актуальная ссылка на состояние юзера для таймеров без сброса интервала
    const userRef = useRef(user);
    userRef.current = user;

    // Периодическое сохранение прогресса игрока на бэкенд и при выходе/сворачивании
    const lastSavedRef = useRef({ balance: user.balance, energy: user.energy });
    useEffect(() => {
        const syncCurrentState = () => {
            const current = userRef.current;
            if (
                current?.id &&
                (current.balance !== lastSavedRef.current.balance ||
                    current.energy !== lastSavedRef.current.energy)
            ) {
                lastSavedRef.current = { balance: current.balance, energy: current.energy };
                syncProgressToServer(current.balance, current.energy).catch((err) => {
                    console.debug('[Sync debug]:', err.message);
                });
            }
        };

        // Запускаем непрерывный интервал каждые 2 секунды (не перезапускается на каждом тике)
        const syncInterval = setInterval(syncCurrentState, 2000);

        // Мгновенная синхронизация при сворачивании приложения в Telegram или закрытии
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                syncCurrentState();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('beforeunload', syncCurrentState);

        return () => {
            clearInterval(syncInterval);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('beforeunload', syncCurrentState);
        };
    }, []);

    // Расчет пассивного дохода в час
    const hourlyIncome = (user.passive_income || 0) * 3600;

    return (
        <div className="relative min-h-screen w-full bg-[#121214] text-white overflow-hidden flex flex-col justify-between cyber-grid select-none pb-24">
            {/* Анимированный фоновый неоновый свет */}
            <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[500px] h-[350px] bg-gradient-to-b from-cyan-500/15 via-purple-600/10 to-transparent blur-3xl pointer-events-none" />

            {/* Вылетающие неоновые цифры тапа */}
            <FloatingText />

            {/* ===================== ХЕДЕР ===================== */}
            <header className="relative z-10 w-full max-w-md mx-auto px-4 pt-4 sm:pt-6">
                {/* Верхняя плашка студии и статуса сети */}
                <div className="flex items-center justify-between mb-3 px-1">
                    <div className="flex items-center gap-2">
                        <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
                        </span>
                        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-[10px] font-orbitron font-bold tracking-wider text-cyan-300">
                            <Terminal className="w-3 h-3 text-cyan-400" />
                            <span>CW Studio</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-950/50 border border-purple-500/30 text-[10px] font-orbitron font-semibold text-purple-300">
                        <ShieldCheck className="w-3 h-3 text-purple-400" />
                        <span>DEMO 1.0</span>
                    </div>
                </div>

                {/* Информационная панель профиля игрока */}
                <div className="rounded-2xl bg-[#181820]/80 backdrop-blur-md border border-slate-800/80 p-3.5 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
                    <div className="flex items-center justify-between">
                        {/* Имя игрока и уровень ИИ */}
                        <div className="flex flex-col">
                            <span className="text-[11px] text-slate-400 font-medium">
                                Оператор ядра
                            </span>
                            <span className="font-orbitron font-bold text-sm text-slate-100 flex items-center gap-1.5">
                                @{user.username || 'CyberAgent'}
                            </span>
                            <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-fuchsia-400 bg-fuchsia-950/40 px-2 py-0.5 rounded-md border border-fuchsia-800/40 w-fit">
                                <Sparkles className="w-3 h-3 text-fuchsia-400" />
                                <span>{user.level_name || `LVL ${user.level || 1} CORE`}</span>
                            </div>
                        </div>

                        {/* Пассивный доход в час */}
                        <div className="flex flex-col items-end text-right">
                            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                                <TrendingUp className="w-3 h-3 text-cyan-400" />
                                Доход в час
                            </span>
                            <span className="font-orbitron font-black text-base text-cyan-300 drop-shadow-[0_0_8px_rgba(0,240,255,0.6)]">
                                +{hourlyIncome.toLocaleString()}
                            </span>
                            <span className="text-[10px] text-cyan-400/70 font-semibold">
                                (+{user.passive_income || 0}/сек)
                            </span>
                        </div>
                    </div>
                </div>

                {/* Главный неоновый счетчик баланса */}
                <div className="mt-6 flex flex-col items-center justify-center text-center">
                    <span className="text-xs uppercase font-orbitron tracking-widest text-slate-400 font-semibold mb-1">
                        Нейро-Баланс
                    </span>
                    <motion.div
                        key={user.balance}
                        initial={{ scale: 0.98 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        className="flex items-center justify-center gap-2"
                    >
                        <div className="p-1.5 rounded-xl bg-cyan-950/70 border border-cyan-400/40 shadow-[0_0_15px_rgba(0,240,255,0.4)]">
                            <Flame className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-400 drop-shadow-[0_0_10px_rgba(0,240,255,0.9)]" />
                        </div>
                        <h1 className="font-orbitron text-4xl sm:text-5xl font-black tracking-tight bg-gradient-to-r from-white via-cyan-200 to-purple-300 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(0,240,255,0.5)]">
                            {Number(user.balance || 0).toLocaleString()}
                        </h1>
                    </motion.div>
                </div>
            </header>

            {/* ===================== ЦЕНТРАЛЬНАЯ КЛИК-ЗОНА ===================== */}
            <main className="relative z-10 flex-1 flex flex-col items-center justify-center my-2">
                {activeTab === 'home' && (
                    <ClickerZone />
                )}

                {/* Вкладка Бустов (если выбрана) */}
                {activeTab === 'boosts' && (
                    <div className="w-full max-w-md px-4 py-8 text-center">
                        <div className="rounded-2xl bg-[#161620]/90 border border-purple-500/30 p-6 shadow-[0_0_30px_rgba(168,85,247,0.2)]">
                            <h2 className="font-orbitron text-xl font-bold text-purple-300 mb-2">
                                🚀 НЕЙРО-УСКОРИТЕЛИ
                            </h2>
                            <p className="text-sm text-slate-400 mb-4">
                                Модернизируйте алгоритмы вычислений и множитель тапа.
                            </p>
                            <div className="space-y-3 text-left">
                                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex justify-between items-center">
                                    <div>
                                        <p className="font-bold text-sm text-white">Квантовый клик (+1)</p>
                                        <p className="text-xs text-slate-400">Стоимость: 500 поинтов</p>
                                    </div>
                                    <button className="px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-bold font-orbitron">
                                        LVL UP
                                    </button>
                                </div>
                                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex justify-between items-center">
                                    <div>
                                        <p className="font-bold text-sm text-white">Авто-майнер (+5/сек)</p>
                                        <p className="text-xs text-slate-400">Стоимость: 2,500 поинтов</p>
                                    </div>
                                    <button className="px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs font-bold font-orbitron">
                                        LVL UP
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Вкладка Друзей (если выбрана) */}
                {activeTab === 'friends' && (
                    <div className="w-full max-w-md px-4 py-8 text-center">
                        <div className="rounded-2xl bg-[#161620]/90 border border-cyan-500/30 p-6 shadow-[0_0_30px_rgba(0,240,255,0.2)]">
                            <h2 className="font-orbitron text-xl font-bold text-cyan-300 mb-2">
                                👥 РЕФЕРАЛЬНЫЙ СИНДИКАТ
                            </h2>
                            <p className="text-sm text-slate-400 mb-4">
                                Приглашайте друзей и получайте <b className="text-cyan-300">+5,000</b> поинтов за каждого агента!
                            </p>
                            <button
                                onClick={() => {
                                    const shareUrl = `https://t.me/share/url?url=https://t.me/YourBot?startapp=ref_${user.id || '123'}&text=Вступай в кибер-синдикат ИИ!`;
                                    window.open(shareUrl, '_blank');
                                }}
                                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-fuchsia-600 font-orbitron font-bold text-sm text-white shadow-[0_0_20px_rgba(0,240,255,0.4)] active:scale-95 transition-transform"
                            >
                                ПРИГЛАСИТЬ ДРУГА
                            </button>
                        </div>
                    </div>
                )}
            </main>

            {/* ===================== ФУТЕР: ЭНЕРГИЯ ===================== */}
            <footer className="relative z-10 w-full max-w-md mx-auto px-4 mb-2">
                <EnergyBar />
            </footer>

            {/* ===================== НАВИГАЦИЯ ===================== */}
            <BottomNav />
        </div>
    );
};

export default HomePage;
