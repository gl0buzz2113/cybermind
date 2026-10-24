import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/useGameStore';

/**
 * FloatingText - компонент для вылетающих вверх неоновых цифр (+1, +5) в точках клика.
 * Может управляться как через пропсы (items, onComplete), так и напрямую через Zustand-стор.
 */
export const FloatingText = ({ items, onComplete }) => {
    const storeItems = useGameStore((state) => state.floatingTexts);
    const removeStoreItem = useGameStore((state) => state.removeFloatingText);

    const activeList = items !== undefined ? items : storeItems;
    const handleComplete = onComplete || removeStoreItem;

    return (
        <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden select-none">
            <AnimatePresence>
                {activeList.map((item) => (
                    <motion.div
                        key={item.id}
                        initial={{
                            opacity: 1,
                            y: 0,
                            scale: 0.8,
                            filter: 'brightness(1.5)',
                        }}
                        animate={{
                            opacity: 0,
                            y: -110,
                            scale: 1.35,
                            filter: 'brightness(1)',
                        }}
                        exit={{ opacity: 0 }}
                        transition={{
                            duration: 0.85,
                            ease: [0.22, 1, 0.36, 1], // Плавный упругий подъем
                        }}
                        onAnimationComplete={() => handleComplete && handleComplete(item.id)}
                        style={{
                            position: 'absolute',
                            left: item.x,
                            top: item.y,
                            transform: 'translate(-50%, -50%)',
                        }}
                        className="font-orbitron font-extrabold text-2xl tracking-wider select-none pointer-events-none"
                    >
                        <span className="bg-gradient-to-r from-cyan-300 via-teal-200 to-fuchsia-400 bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(0,240,255,0.9)]">
                            {typeof item.value === 'number' ? `+${item.value}` : item.value}
                        </span>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

export default FloatingText;
