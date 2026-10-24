import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Terminal, Flame, TrendingUp, ShieldCheck, RefreshCw } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';
import { ClickerZone } from '../components/game/ClickerZone';
import { EnergyBar } from '../components/game/EnergyBar';
import { FloatingText } from '../components/game/FloatingText';
import { BottomNav } from '../components/layout/BottomNav';
import { BoostsPage } from './BoostsPage';
import { FriendsPage } from './FriendsPage';
import { syncProgressToServer, loginWithTelegram } from '../api/client';
import { supabase } from '../supabase';

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
    const [isStudioFolded, setIsStudioFolded] = useState(false);

    const consumeDelta = useGameStore((state) => state.consumeDelta);
    const restoreDelta = useGameStore((state) => state.restoreDelta);
    const applyAuthoritativeBalance = useGameStore((state) => state.applyAuthoritativeBalance);

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

    // Атомарная RPC-синхронизация кликов и баланса каждые 3 секунды
    useEffect(() => {
        let isSyncing = false;

        const syncWithRpc = async () => {
            if (isSyncing) return;
            const current = userRef.current;
            if (!current?.id) return;

            isSyncing = true;
            const localDelta = consumeDelta();

            try {
                // Раз в 3 секунды вызываем нашу RPC-функцию:
                // Важно: Если localDelta равна 0, запрос всё равно отправляется (с delta_param: 0),
                // чтобы просто забрать из data свежий актуальный баланс, который мог измениться с другого устройства.
                const { data, error } = await supabase.rpc('increment_balance', {
                    user_id_param: String(current.id),
                    delta_param: localDelta,
                });

                if (!error && data) {
                    const freshBalance = data.balance ?? (typeof data === 'number' ? data : null);
                    if (freshBalance !== null && Number.isFinite(Number(freshBalance))) {
                        // Полученный из базы data.balance жестко перезаписывает отображаемый баланс на экране
                        applyAuthoritativeBalance(Number(freshBalance));
                    }
                } else if (error) {
                    console.debug('[RPC increment_balance Error]:', error.message);
                    restoreDelta(localDelta);
                }
            } catch (err) {
                console.debug('[RPC increment_balance Exception]:', err.message);
                restoreDelta(localDelta);
            } finally {
                isSyncing = false;
            }
        };

        // Запускаем непрерывный интервал ровно раз в 3 секунды
        const syncInterval = setInterval(syncWithRpc, 3000);

        // Мгновенная синхронизация при сворачивании приложения в Telegram или закрытии вкладки
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                syncWithRpc();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('beforeunload', syncWithRpc);

        return () => {
            clearInterval(syncInterval);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('beforeunload', syncWithRpc);
        };
    }, [consumeDelta, restoreDelta, applyAuthoritativeBalance]);

    // Расчет пассивного дохода в час
    const hourlyIncome = (user.passive_income || 0) * 3600;

    return (
        <div className="relative min-h-screen w-full bg-[#121214] text-white overflow-x-hidden flex flex-col justify-between cyber-grid select-none pb-28">
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
                        <motion.div
                            onClick={() => {
                                setIsStudioFolded(true);
                                try {
                                    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');
                                } catch {}
                                setTimeout(() => setIsStudioFolded(false), 700);
                            }}
                            className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-[10px] font-orbitron font-bold tracking-wider text-cyan-300 cursor-pointer select-none"
                            style={{ perspective: 500 }}
                            whileHover={{ scale: 0.96 }}
                            whileTap={{ scale: 0.94 }}
                            title="CW Studio (нажмите или наведите для сворачивания)"
                        >
                            <Terminal className="w-3 h-3 text-cyan-400 shrink-0" />
                            <motion.span
                                className="inline-block origin-top overflow-hidden"
                                animate={isStudioFolded ? {
                                    scaleY: 0.05,
                                    rotateX: 85,
                                    opacity: 0.25,
                                    y: -1,
                                } : {
                                    scaleY: 1,
                                    rotateX: 0,
                                    opacity: 1,
                                    y: 0,
                                }}
                                whileHover={{
                                    scaleY: 0.05,
                                    rotateX: 85,
                                    opacity: 0.25,
                                    y: -1,
                                    transition: { duration: 0.22, ease: [0.4, 0, 0.2, 1] }
                                }}
                                whileTap={{
                                    scaleY: 0.05,
                                    rotateX: 85,
                                    opacity: 0.25,
                                    y: -1,
                                    transition: { duration: 0.22, ease: [0.4, 0, 0.2, 1] }
                                }}
                                transition={{ type: 'spring', stiffness: 450, damping: 22 }}
                            >
                                CW Studio
                            </motion.span>
                        </motion.div>
                    </div>

                    <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-950/50 border border-purple-500/30 text-[10px] font-orbitron font-semibold text-purple-300">
                        <ShieldCheck className="w-3 h-3 text-purple-400" />
                        <span>DEMO 1.5</span>
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
                                {user.id && (
                                    <span className="text-[10px] font-medium text-cyan-400/80">
                                        #{user.id}
                                    </span>
                                )}
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

            {/* ===================== ЦЕНТРАЛЬНАЯ КЛИК-ЗОНА / ВКЛАДКИ ===================== */}
            <main className="relative z-10 flex-1 flex flex-col items-center justify-center my-2 w-full">
                {activeTab === 'home' && <ClickerZone />}
                {activeTab === 'boosts' && <BoostsPage />}
                {activeTab === 'friends' && <FriendsPage />}
            </main>

            {/* ===================== ФУТЕР: ЭНЕРГИЯ ===================== */}
            <footer className="relative z-10 w-full max-w-md mx-auto px-4 mb-2">
                {activeTab === 'home' && <EnergyBar />}
            </footer>

            {/* ===================== НАВИГАЦИЯ ===================== */}
            <BottomNav />
        </div>
    );
};

export default HomePage;
