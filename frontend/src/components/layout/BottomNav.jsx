import React from 'react';
import { motion } from 'framer-motion';
import { Cpu, Rocket, Users } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';

/**
 * BottomNav - Фиксированная нижняя киберпанк-панель навигации.
 * Вкладки:
 * - Главная (Ядро кликера)
 * - Бусты (Улучшения ИИ)
 * - Друзья (Реферальная программа)
 */
export const BottomNav = () => {
    const activeTab = useGameStore((state) => state.activeTab);
    const setActiveTab = useGameStore((state) => state.setActiveTab);

    const navItems = [
        {
            id: 'home',
            label: 'Главная',
            icon: Cpu,
            badge: null,
        },
        {
            id: 'boosts',
            label: 'Бусты',
            icon: Rocket,
            badge: 'NEW',
        },
        {
            id: 'friends',
            label: 'Друзья',
            icon: Users,
            badge: '+5k',
        },
    ];

    const handleTabChange = (tabId) => {
        try {
            window.Telegram?.WebApp?.HapticFeedback?.selectionChanged();
        } catch {}
        setActiveTab(tabId);
    };

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-4 pt-2">
            <div className="max-w-md mx-auto rounded-2xl bg-[#121218]/90 backdrop-blur-xl border border-cyan-500/20 shadow-[0_-4px_25px_rgba(0,0,0,0.6),0_0_20px_rgba(0,240,255,0.15)] px-3 py-2">
                <div className="flex items-center justify-around gap-2">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;

                        return (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => handleTabChange(item.id)}
                                className={`relative flex flex-1 flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all duration-200 cursor-pointer ${
                                    isActive
                                        ? 'text-cyan-300'
                                        : 'text-slate-400 hover:text-slate-200'
                                }`}
                            >
                                {/* Фоновый неоновый бейдж активного таба */}
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTabIndicator"
                                        className="absolute inset-0 rounded-xl bg-gradient-to-t from-cyan-500/20 via-purple-500/10 to-transparent border border-cyan-400/30 shadow-[0_0_15px_rgba(0,240,255,0.25)]"
                                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                    />
                                )}

                                {/* Иконка с эффектом свечения */}
                                <div className="relative z-10 flex items-center justify-center mb-1">
                                    <Icon
                                        className={`w-5 h-5 transition-transform duration-200 ${
                                            isActive
                                                ? 'scale-110 text-cyan-300 drop-shadow-[0_0_8px_rgba(0,240,255,0.9)]'
                                                : 'text-slate-400'
                                        }`}
                                    />

                                    {/* Бейдж новинок/бонусов */}
                                    {item.badge && (
                                        <span className="absolute -top-1.5 -right-3 text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-gradient-to-r from-fuchsia-600 to-pink-500 text-white shadow-[0_0_8px_rgba(236,72,153,0.8)]">
                                            {item.badge}
                                        </span>
                                    )}
                                </div>

                                {/* Текстовая подпись */}
                                <span
                                    className={`relative z-10 text-[11px] font-orbitron font-semibold tracking-wide ${
                                        isActive
                                            ? 'text-cyan-200 drop-shadow-[0_0_6px_rgba(0,240,255,0.7)]'
                                            : 'text-slate-400'
                                    }`}
                                >
                                    {item.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
};

export default BottomNav;
