import React from 'react';
import { motion } from 'framer-motion';
import {
    Zap,
    Cpu,
    Flame,
    Server,
    BatteryCharging,
    TrendingUp,
    Sparkles,
    Rocket,
    Shield,
    Star,
    CheckCircle,
    Award,
} from 'lucide-react';
import {
    useGameStore,
    BASE_BOOSTS,
    STARS_BOOSTS,
    LEVEL_TIERS,
} from '../store/useGameStore';

export const BoostsPage = () => {
    const user = useGameStore((state) => state.user);
    const boostLevels = useGameStore((state) => state.boostLevels);
    const getBoostPrice = useGameStore((state) => state.getBoostPrice);
    const buyBoost = useGameStore((state) => state.buyBoost);
    const buyStarsBoost = useGameStore((state) => state.buyStarsBoost);

    // Иконки для бустов
    const iconMap = {
        Zap,
        Cpu,
        Flame,
        Server,
        BatteryCharging,
        TrendingUp,
        Sparkles,
        Rocket,
        Shield,
    };

    // Расчет прогресса до следующего уровня ИИ
    const currentTierIndex = LEVEL_TIERS.findIndex((t) => t.level === user.level);
    const nextTier = LEVEL_TIERS[currentTierIndex + 1] || null;
    const currentMin = LEVEL_TIERS[currentTierIndex]?.minPoints || 0;
    const nextMin = nextTier ? nextTier.minPoints : currentMin;
    const levelProgress = nextTier
        ? Math.min(100, Math.max(0, ((user.balance - currentMin) / (nextMin - currentMin)) * 100))
        : 100;

    return (
        <div className="w-full max-w-md mx-auto px-4 py-4 space-y-5 text-white select-none">
            {/* Карточка ранга / уровня ядра */}
            <div className="rounded-3xl bg-[#161622]/90 border border-cyan-500/30 p-5 shadow-[0_0_25px_rgba(0,240,255,0.2)]">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-400/40 shadow-[0_0_12px_rgba(0,240,255,0.4)]">
                            <Award className="w-6 h-6 text-cyan-300 drop-shadow-[0_0_8px_rgba(0,240,255,0.8)]" />
                        </div>
                        <div>
                            <span className="text-[10px] font-orbitron uppercase tracking-widest text-slate-400">
                                Уровень Ядра
                            </span>
                            <h3 className="font-orbitron font-extrabold text-base text-cyan-200">
                                LVL {user.level} · {user.level_name}
                            </h3>
                        </div>
                    </div>

                    <span className="text-xs font-orbitron font-bold text-cyan-400 bg-cyan-950/60 px-2.5 py-1 rounded-full border border-cyan-800/40">
                        {Math.floor(levelProgress)}%
                    </span>
                </div>

                {/* Прогресс-бар уровня */}
                <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden p-[1px] border border-cyan-500/20 mt-3">
                    <motion.div
                        className="h-full bg-gradient-to-r from-cyan-500 via-fuchsia-500 to-purple-400 rounded-full"
                        animate={{ width: `${levelProgress}%` }}
                        transition={{ duration: 0.5 }}
                    />
                </div>

                <div className="flex justify-between items-center mt-2 text-[10px] font-semibold text-slate-400 font-orbitron">
                    <span>{user.balance.toLocaleString()} PTS</span>
                    {nextTier ? (
                        <span>Следующий ранг: {nextMin.toLocaleString()} PTS</span>
                    ) : (
                        <span className="text-amber-400">МАКСИМАЛЬНЫЙ РАНГ</span>
                    )}
                </div>
            </div>

            {/* СЕКЦИЯ 1: Премиум-бусты за Telegram Stars */}
            <div className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <h3 className="font-orbitron font-extrabold text-sm tracking-wider text-amber-300 uppercase">
                        Премиум Stars Бусты (⭐)
                    </h3>
                </div>

                <div className="grid grid-cols-1 gap-3">
                    {STARS_BOOSTS.map((boost) => {
                        const Icon = iconMap[boost.icon] || Sparkles;

                        return (
                            <div
                                key={boost.id}
                                className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a1429] via-[#141220] to-[#1e1026] border border-amber-500/40 p-4 shadow-[0_0_20px_rgba(245,158,11,0.15)]"
                            >
                                {/* Фоновый неоновый отблеск */}
                                <div className="absolute -top-10 -right-10 w-28 h-28 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 rounded-2xl bg-amber-950/50 border border-amber-500/40 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                                            <Icon className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-1.5 mb-0.5">
                                                <h4 className="font-orbitron font-bold text-sm text-amber-100">
                                                    {boost.title}
                                                </h4>
                                                <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                                    {boost.badge}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-300 leading-tight">
                                                {boost.desc}
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => buyStarsBoost(boost.id)}
                                        className="shrink-0 flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-black font-orbitron font-extrabold text-xs shadow-[0_0_15px_rgba(245,158,11,0.5)] active:scale-95 transition-transform cursor-pointer"
                                    >
                                        <Star className="w-3.5 h-3.5 fill-black" />
                                        <span>{boost.starsPrice}</span>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* СЕКЦИЯ 2: Нейро-ускорители за очки баланса */}
            <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-cyan-400" />
                        <h3 className="font-orbitron font-extrabold text-sm tracking-wider text-cyan-300 uppercase">
                            Нейро-Апгрейды ядра
                        </h3>
                    </div>
                    <span className="text-[11px] font-orbitron font-bold text-slate-400">
                        Баланс: {user.balance.toLocaleString()} PTS
                    </span>
                </div>

                <div className="space-y-2.5">
                    {BASE_BOOSTS.map((boost) => {
                        const Icon = iconMap[boost.icon] || Zap;
                        const price = getBoostPrice(boost.id);
                        const currentLvl = boostLevels[boost.id] || 0;
                        const canAfford = user.balance >= price;

                        return (
                            <div
                                key={boost.id}
                                className={`rounded-2xl p-3.5 border transition-all ${
                                    canAfford
                                        ? 'bg-[#151522]/90 border-slate-700/80 hover:border-cyan-500/40'
                                        : 'bg-[#121218]/80 border-slate-800/60 opacity-80'
                                } flex items-center justify-between gap-3`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 shadow-[0_0_10px_rgba(0,240,255,0.2)]">
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-orbitron font-bold text-xs text-slate-100">
                                                {boost.title}
                                            </h4>
                                            {currentLvl > 0 && (
                                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-700/40">
                                                    LVL {currentLvl}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[11px] text-slate-400 mt-0.5">
                                            {boost.desc}
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => buyBoost(boost.id)}
                                    disabled={!canAfford}
                                    className={`shrink-0 px-3 py-2 rounded-xl font-orbitron font-bold text-xs transition-all ${
                                        canAfford
                                            ? 'bg-gradient-to-r from-cyan-500/30 to-fuchsia-600/30 text-cyan-200 border border-cyan-400/50 shadow-[0_0_12px_rgba(0,240,255,0.25)] active:scale-95 cursor-pointer hover:bg-cyan-500/40'
                                            : 'bg-slate-800/40 text-slate-500 border border-slate-700/40 cursor-not-allowed'
                                    }`}
                                >
                                    <div className="flex flex-col items-center">
                                        <span>LVL UP</span>
                                        <span className="text-[9px] font-semibold text-slate-300">
                                            {price.toLocaleString()}
                                        </span>
                                    </div>
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default BoostsPage;
