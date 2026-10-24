import React, { useState } from 'react';
import { Users, Copy, Check, Gift } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';

export const FriendsPage = () => {
    const user = useGameStore((state) => state.user);
    const [copied, setCopied] = useState(false);

    const botUsername = 'YourBot';
    const referralLink = `https://t.me/${botUsername}?startapp=ref_${user.id || '123'}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(referralLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleShare = () => {
        const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent('Вступай в кибер-синдикат ИИ и получи 5,000 стартовых очков!')}`;
        window.open(shareUrl, '_blank');
    };

    return (
        <div className="w-full max-w-md mx-auto px-4 py-6 text-white">
            <div className="rounded-3xl bg-[#161622]/90 border border-cyan-500/30 p-6 shadow-[0_0_30px_rgba(0,240,255,0.2)]">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 rounded-2xl bg-cyan-950/80 border border-cyan-400/40 shadow-[0_0_15px_rgba(0,240,255,0.4)]">
                        <Users className="w-7 h-7 text-cyan-300 drop-shadow-[0_0_8px_rgba(0,240,255,0.8)]" />
                    </div>
                    <div>
                        <h2 className="font-orbitron text-xl font-bold text-cyan-300">
                            КИБЕР-СИНДИКАТ
                        </h2>
                        <p className="text-xs text-slate-400">
                            Реферальная программа агентов
                        </p>
                    </div>
                </div>

                <div className="my-6 p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 flex items-center gap-3">
                    <Gift className="w-8 h-8 text-cyan-400 shrink-0" />
                    <div className="text-xs text-slate-300">
                        Получите <span className="text-cyan-300 font-bold font-orbitron">+5,000</span> поинтов за каждого приглашенного друга, и друг тоже получит бонус!
                    </div>
                </div>

                <div className="space-y-3">
                    <button
                        onClick={handleShare}
                        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 font-orbitron font-bold text-sm text-white shadow-[0_0_20px_rgba(0,240,255,0.4)] active:scale-95 transition-transform"
                    >
                        ПРИГЛАСИТЬ ДРУГА
                    </button>

                    <button
                        onClick={handleCopy}
                        className="w-full py-2.5 rounded-xl bg-slate-900 border border-slate-700 font-orbitron text-xs text-slate-300 flex items-center justify-center gap-2 hover:bg-slate-800"
                    >
                        {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                        {copied ? 'ССЫЛКА СКОПИРОВАНА' : 'СКОПИРОВАТЬ ССЫЛКУ'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FriendsPage;
