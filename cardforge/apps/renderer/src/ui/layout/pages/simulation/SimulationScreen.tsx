// src/ui/layout/pages/simulation/SimulationScreen.tsx
import { memo } from 'react';
import { Swords } from 'lucide-react';

export const SimulationScreen = memo(() => {
    return (
        <div className="h-full w-full flex flex-col items-center justify-center text-center bg-[#070a14] p-8">
            <div className="w-24 h-24 rounded-3xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-6">
                <Swords size={40} className="text-purple-500/60" />
            </div>
            <h2 className="text-2xl font-black text-white mb-3 tracking-wide">
                ساحة المحاكاة
            </h2>
            <p className="text-sm text-slate-400 max-w-md leading-relaxed">
                قريباً: جرب كروتك وتحدى الذكاء الاصطناعي هنا...
            </p>
        </div>
    );
});

SimulationScreen.displayName = 'SimulationScreen';
