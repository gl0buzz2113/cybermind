import React, { useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { Cpu, Zap } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';

/**
 * ClickerZone - Пульсирующее интерактивное ядро ИИ (AI Core).
 * Реализует:
 * - Поддержку мультитача (одновременные тапы несколькими пальцами)
 * - Упругую отдачу при нажатии (squash & stretch с framer-motion)
 * - Расход энергии и начисление очков через useGameStore
 * - Спавн неоновых вылетающих цифр в точных координатах тапа
 * - Haptic feedback в Telegram WebApp
 */
export const ClickerZone = ({ onCustomTap }) => {
    const user = useGameStore((state) => state.user);
    const click = useGameStore((state) => state.click);
    const addFloatingText = useGameStore((state) => state.addFloatingText);

    // Контроллеры анимации для эффекта импульса
    const coreControls = useAnimation();
    const [isLowEnergy, setIsLowEnergy] = useState(false);

    // Безопасный вызов вибрации Telegram WebApp
    const triggerHaptic = (style = 'light') => {
        try {
            window.Telegram?.WebApp?.HapticFeedback?.impactOccurred(style);
        } catch {
            // Игнорируем в обычном браузере
        }
    };

    // Общая функция обработки единичного или множественного тапа
    const processTap = (coordinates) => {
        if (!coordinates || coordinates.length === 0) return;

        const touchCount = coordinates.length;
        const result = click(touchCount);

        if (!result.success || result.earned <= 0) {
            // Энергия на нуле: предупреждающая вибрация и анимация ошибки
            try {
                window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('warning');
            } catch {}
            setIsLowEnergy(true);
            setTimeout(() => setIsLowEnergy(false), 400);
            return;
        }

        // Успешный клик
        triggerHaptic('medium');

        // Распределяем заработанные поинты по точкам касания
        const pointsPerTouch = Math.max(1, Math.floor(result.earned / (result.multiplier || touchCount)));

        coordinates.forEach(({ x, y }) => {
            // Добавляем вылетающий текст в стор
            addFloatingText(x, y, pointsPerTouch);

            if (onCustomTap) {
                onCustomTap({ x, y, points: pointsPerTouch });
            }
        });
    };

    // Обработка мультитача на смартфонах
    const handleTouchStart = (e) => {
        const touches = Array.from(e.changedTouches).map((t) => ({
            x: t.clientX,
            y: t.clientY,
        }));
        processTap(touches);
    };

    // Обработка клика мыши на десктопе
    const handleClick = (e) => {
        // Если событие вызвано тачем, браузер может эмулировать click, избегаем дублей
        if (e.nativeEvent && 'ontouchstart' in window && e.detail === 0) {
            return;
        }
        processTap([{ x: e.clientX, y: e.clientY }]);
    };

    return (
        <div className="relative flex items-center justify-center py-6 select-none touch-none">
            {/* Внешние декоративные неоновые кольца (орбиты ИИ) */}
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
                className="absolute h-72 w-72 sm:h-80 sm:w-80 rounded-full border border-cyan-500/20 border-dashed pointer-events-none"
            />

            <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 35, repeat: Infinity, ease: 'linear' }}
                className="absolute h-80 w-80 sm:h-92 sm:w-92 rounded-full border border-purple-500/25 pointer-events-none"
            />

            {/* Мягкое фоновое пульсирующее неоновое свечение (аура) */}
            <motion.div
                animate={{
                    scale: [1, 1.08, 1],
                    opacity: [0.35, 0.65, 0.35],
                }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className={`absolute h-60 w-60 sm:h-68 sm:w-68 rounded-full blur-3xl pointer-events-none transition-colors duration-300 ${
                    isLowEnergy
                        ? 'bg-rose-600/40'
                        : 'bg-gradient-to-tr from-cyan-500/40 via-purple-600/30 to-pink-500/40'
                }`}
            />

            {/* Главная кнопка-ядро (Core) */}
            <motion.button
                type="button"
                onTouchStart={handleTouchStart}
                onClick={handleClick}
                whileTap={{
                    scale: 0.91,
                    rotate: [-1.5, 1.5, 0],
                }}
                animate={coreControls}
                transition={{
                    type: 'spring',
                    stiffness: 550,
                    damping: 22,
                    mass: 0.8,
                }}
                className={`relative flex items-center justify-center h-60 w-60 sm:h-68 sm:w-68 rounded-full cursor-pointer focus:outline-none transition-all duration-300 ${
                    isLowEnergy
                        ? 'ring-4 ring-rose-500/60 shadow-[0_0_40px_rgba(244,63,94,0.5)]'
                        : 'shadow-[0_0_50px_rgba(0,240,255,0.4),0_0_80px_rgba(168,85,247,0.3)]'
                }`}
                style={{
                    background: 'radial-gradient(circle at 35% 30%, #1e1b4b 0%, #0f172a 60%, #030712 100%)',
                }}
            >
                {/* Внутренняя градиентная кайма ядра */}
                <div className="absolute inset-1.5 rounded-full p-[2px] bg-gradient-to-br from-cyan-400 via-fuchsia-500 to-indigo-600">
                    <div className="h-full w-full rounded-full bg-[#121218]/90 backdrop-blur-md flex items-center justify-center overflow-hidden relative">
                        {/* Кибернетический узор / микросхема на фоне ядра */}
                        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#00f0ff_1px,transparent_1px)] [background-size:16px_16px]" />

                        {/* Внутреннее световое пятно (голографический блик) */}
                        <div className="absolute -top-10 -left-10 w-36 h-36 bg-cyan-400/25 rounded-full blur-xl pointer-events-none" />
                        <div className="absolute -bottom-10 -right-10 w-36 h-36 bg-purple-500/30 rounded-full blur-xl pointer-events-none" />

                        {/* Центральный визуальный чип интеллекта */}
                        <div className="relative z-10 flex flex-col items-center justify-center text-center">
                            {/* Неоновый процессор */}
                            <motion.div
                                animate={{
                                    scale: [1, 1.05, 1],
                                }}
                                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                                className="relative flex items-center justify-center p-4 rounded-2xl bg-cyan-950/60 border border-cyan-400/50 shadow-[0_0_20px_rgba(0,240,255,0.4)]"
                            >
                                <Cpu className="w-12 h-12 sm:w-14 sm:h-14 text-cyan-300 drop-shadow-[0_0_12px_rgba(0,240,255,0.9)]" />
                                
                                {/* Мелкий индикатор активности */}
                                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500" />
                                </span>
                            </motion.div>

                            {/* Текст и уровень силы клика */}
                            <span className="mt-3 font-orbitron font-extrabold tracking-widest text-sm text-cyan-200 drop-shadow-[0_0_8px_rgba(0,240,255,0.7)]">
                                AI CORE
                            </span>
                            <span className="mt-0.5 text-[10px] tracking-wider uppercase font-semibold text-fuchsia-300/80 flex items-center gap-1">
                                <Zap className="w-3 h-3 text-fuchsia-400" />
                                +{user.click_power} / TAP
                            </span>
                        </div>
                    </div>
                </div>
            </motion.button>
        </div>
    );
};

export default ClickerZone;
