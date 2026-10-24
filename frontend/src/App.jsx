// frontend/src/App.jsx
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Sparkles, CheckCircle2 } from 'lucide-react';
import { loginWithTelegram } from './api/client';
import { useGameStore } from './store/useGameStore';
import { HomePage } from './pages/HomePage';

function App() {
    const setUser = useGameStore((state) => state.setUser);
    const [offlineEarned, setOfflineEarned] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const initApp = async () => {
            try {
                // 1. Инициализация Telegram WebApp
                const tg = window.Telegram?.WebApp;
                if (tg) {
                    tg.ready();
                    tg.expand();
                }

                // 2. Авторизация на бэкенде
                const data = await loginWithTelegram();

                // 3. Сохранение данных пользователя в Zustand стор
                if (data && data.user) {
                    setUser(data.user);
                }

                // 4. Проверка офлайн дохода
                if (data.offlineStats?.earnedPoints > 0) {
                    setOfflineEarned(data.offlineStats.earnedPoints);
                }
            } catch (err) {
                console.warn('[App Init Warning]:', err.message);
                // В режиме разработки локально без бэкенда продолжаем с дефолтным пользователем из стора
                if (import.meta.env.DEV) {
                    console.log('Запуск в режиме разработчика с локальным стейтом.');
                } else {
                    setError(err.message);
                }
            } finally {
                setLoading(false);
            }
        };

        initApp();
    }, [setUser]);

    // Экран загрузки в неоновом стиле
    if (loading) {
        return (
            <div className="flex h-screen w-full flex-col items-center justify-center bg-[#121214] text-white">
                <div className="relative flex items-center justify-center">
                    <div className="h-20 w-20 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin" />
                    <Sparkles className="absolute w-8 h-8 text-cyan-300 drop-shadow-[0_0_12px_rgba(0,240,255,0.8)]" />
                </div>
                <p className="mt-4 font-orbitron text-sm font-bold tracking-widest text-cyan-300 animate-pulse">
                    СИНХРОНИЗАЦИЯ С ИИ-ЯДРОМ...
                </p>
            </div>
        );
    }

    // Экран ошибки
    if (error) {
        return (
            <div className="flex h-screen flex-col items-center justify-center bg-[#121214] p-6 text-center text-rose-400">
                <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 max-w-sm">
                    <h2 className="font-orbitron text-lg font-bold mb-2">ОШИБКА ДОСТУПА</h2>
                    <p className="text-sm text-slate-300 mb-4">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 rounded-xl bg-rose-600/30 text-rose-200 border border-rose-500/40 text-xs font-bold font-orbitron"
                    >
                        ПОВТОРИТЬ
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen bg-[#121214]">
            {/* Главный экран кликера */}
            <HomePage />

            {/* Модальное окно начисленного офлайн-дохода */}
            <AnimatePresence>
                {offlineEarned > 0 && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                        <motion.div
                            initial={{ scale: 0.85, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.85, opacity: 0 }}
                            className="w-full max-w-sm rounded-3xl bg-[#161622] border border-cyan-500/40 p-6 text-center shadow-[0_0_40px_rgba(0,240,255,0.3)]"
                        >
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-950/80 border border-cyan-400/50 shadow-[0_0_20px_rgba(0,240,255,0.4)]">
                                <Flame className="h-9 w-9 text-cyan-300 drop-shadow-[0_0_8px_rgba(0,240,255,0.8)]" />
                            </div>

                            <h3 className="font-orbitron text-lg font-extrabold text-white mb-1">
                                ОФЛАЙН-МАЙНИНГ
                            </h3>
                            <p className="text-xs text-slate-400 mb-4">
                                Пока вы отсутствовали, ваше квантовое ядро сгенерировало данные:
                            </p>

                            <div className="mb-6 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 py-3">
                                <span className="font-orbitron text-2xl font-black text-cyan-300 drop-shadow-[0_0_10px_rgba(0,240,255,0.8)]">
                                    +{offlineEarned.toLocaleString()}
                                </span>
                                <span className="block text-[10px] text-cyan-400/80 font-bold uppercase mt-0.5">
                                    Поинтов начислено
                                </span>
                            </div>

                            <button
                                onClick={() => setOfflineEarned(0)}
                                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 font-orbitron font-bold text-sm text-white shadow-[0_0_20px_rgba(0,240,255,0.4)] active:scale-95 transition-transform flex items-center justify-center gap-2"
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                ЗАБРАТЬ НАГРАДУ
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default App;