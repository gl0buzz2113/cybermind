import React from 'react';
import { Rocket, Zap, Sparkles, TrendingUp } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';

export const BoostsPage = () => {
    const user = useGameStore((state) => state.user);

    return (
        <div className="w-full max-w-md mx-auto px-4 py-6 text-white">
            <div className="rounded-3xl bg-[#161622]/90 border border-purple-500/30 p-6 shadow-[0_0_30px_rgba(168,85,247,0.2)]">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 rounded-2xl bg-purple-950/80 border border-purple-400/40 shadow-[0_0_15px_rgba(168,85,247,0.4)]">
                        <Rocket className="w-7 h-7 text-purple-300 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
                    </div>
                    <div>
                        <h2 className="font-orbitron text-xl font-bold text-purple-300">
                            НЕЙРО-УСКОРИТЕЛИ
                        </h2>
                        <p className="text-xs text-slate-400">
                            Апгрейды ядра и авто-майнинга
                        </p>
                    </div>
                </div>

                <div className="space-y-3 mt-6">
                    <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Zap className="w-5 h-5 text-cyan-400" />
                            <div>
                                <p className="font-bold text-sm text-white">Квантовый клик (+1)</p>
                                <p className="text-xs text-slate-400">Сила тапа: {user.click_power}</p>
                            </div>
                        </div>
                        <button className="px-3 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-bold font-orbitron hover:bg-cyan-500/30">
                            500 PTS
                        </button>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <TrendingUp className="w-5 h-5 text-purple-400" />
                            <div>
                                <p className="font-bold text-sm text-white">Авто-майнер (+3/сек)</p>
                                <p className="text-xs text-slate-400">Доход: +{user.passive_income}/сек</p>
                            </div>
                        </div>
                        <button className="px-3 py-1.5 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs font-bold font-orbitron hover:bg-purple-500/30">
                            2 500 PTS
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BoostsPage;
