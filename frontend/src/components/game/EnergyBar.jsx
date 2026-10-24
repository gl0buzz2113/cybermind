import React from 'react';
import { motion } from 'framer-motion';
import { Zap, BatteryCharging, ShieldAlert } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';

/**
 * EnergyBar - Неоновый индикатор запаса энергии ИИ.
 * Отображает текущее количество энергии, плавную анимацию заполнения,
 * неоновые эффекты свечения и статус регенерации.
 */
export const EnergyBar = () => {
    const user = useGameStore((state) => state.user) || {};
    const energy = typeof user.energy === 'number' ? user.energy : 1000;
    const maxEnergy = typeof user.max_energy === 'number' && user.max_energy > 0 ? user.max_energy : 1000;

    const percentage = Math.min(100, Math.max(0, (energy / maxEnergy) * 100));
    const isLow = percentage < 20;

    return (
        <div className="w-full max-w-md mx-auto px-2 select-none">
            {/* Верхняя строка статуса энергии */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                    <span className="flex items-center justify-center p-1 rounded-lg bg-cyan-950/80 border border-cyan-500/30 shadow-[0_0_10px_rgba(0,240,255,0.3)]">
                        <Zap className={`w-4 h-4 ${isLow ? 'text-rose-400 animate-pulse' : 'text-cyan-400 drop-shadow-[0_0_6px_rgba(0,240,255,0.8)]'}`} />
                    </span>
                    <span className="font-orbitron font-bold text-xs uppercase tracking-wider text-slate-300">
                        Энергия
                    </span>
                    {percentage < 100 && (
                        <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold text-cyan-400/80 bg-cyan-950/40 px-2 py-0.5 rounded-full border border-cyan-800/40">
                            <BatteryCharging className="w-3 h-3 animate-spin" style={{ animationDuration: '3s' }} />
                            +1/s
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-1.5 font-orbitron font-bold text-sm tracking-wide">
                    <span className={isLow ? 'text-rose-400' : 'text-cyan-300'}>
                        {energy.toLocaleString()}
                    </span>
                    <span className="text-slate-500 text-xs">/</span>
                    <span className="text-slate-400 text-xs">
                        {maxEnergy.toLocaleString()}
                    </span>
                </div>
            </div>

            {/* Внешний контейнер неоновой полосы */}
            <div className="relative h-4 w-full rounded-full bg-slate-900/90 p-[2px] border border-cyan-500/30 shadow-[0_0_15px_rgba(0,240,255,0.15)] overflow-hidden">
                {/* Фоновая кибернетическая сетка внутри бара */}
                <div className="absolute inset-0 opacity-15 bg-[repeating-linear-gradient(45deg,#00f0ff_0,#00f0ff_2px,transparent_0,transparent_8px)]" />

                {/* Анимированный градиентный бар заполнения */}
                <motion.div
                    className={`relative h-full rounded-full transition-all ${
                        isLow
                            ? 'bg-gradient-to-r from-rose-600 via-amber-500 to-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.6)]'
                            : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 shadow-[0_0_18px_rgba(0,240,255,0.5)]'
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{
                        type: 'spring',
                        stiffness: 120,
                        damping: 20,
                        mass: 0.5,
                    }}
                >
                    {/* Скользящий световой блик по поверхности бара */}
                    <div className="absolute inset-0 bg-gradient-to-b from-white/25 via-transparent to-black/20 rounded-full" />

                    {/* Неоновая светящаяся головка бара */}
                    {percentage > 2 && (
                        <div className="absolute right-0 top-0 bottom-0 w-2 rounded-full bg-white shadow-[0_0_10px_#fff,0_0_20px_#00f0ff]" />
                    )}
                </motion.div>
            </div>

            {/* Подсказка при истощении энергии */}
            {isLow && (
                <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-1.5 flex items-center justify-center gap-1 text-[11px] font-medium text-rose-400/90 text-center"
                >
                    <ShieldAlert className="w-3 h-3" />
                    <span>Низкий заряд ядра! Подождите восстановления...</span>
                </motion.div>
            )}
        </div>
    );
};

export default EnergyBar;
