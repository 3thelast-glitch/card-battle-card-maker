// TemplateGallery.tsx
// Floating glassmorphic panel with card template thumbnails.
import { memo } from 'react';
import { X, Sparkles } from 'lucide-react';
import { useCardEditorStore } from '../../../../store/cardEditorStore';

type TemplateTheme = {
  id: string;
  label: string;
  bg: string;
  accentColor: string;
  borderColor: string;
  emoji: string;
};

const TEMPLATES: TemplateTheme[] = [
  {
    id: 'classic',
    label: 'كلاسيك',
    bg: 'linear-gradient(145deg,#1a1a2e,#16213e)',
    accentColor: '#94a3b8',
    borderColor: 'rgba(148,163,184,0.4)',
    emoji: '⚔️',
  },
  {
    id: 'modern-dark',
    label: 'حديث داكن',
    bg: 'linear-gradient(145deg,#0a0a0c,#15151a)',
    accentColor: '#fbbf24',
    borderColor: '#2a2a35',
    emoji: '🌑',
  },
  {
    id: 'steampunk',
    label: 'ستيم بانك',
    bg: 'linear-gradient(145deg,#2C1810,#1A0F08)',
    accentColor: '#B5842E',
    borderColor: '#4A2511',
    emoji: '⚙️',
  },
  {
    id: 'blood-ritual',
    label: 'طقوس الدم',
    bg: 'linear-gradient(145deg,#200000,#0a0000)',
    accentColor: '#dc2626',
    borderColor: '#7f1d1d',
    emoji: '🩸',
  },
];

export const TemplateGallery = memo(() => {
  const closeTemplateGallery = useCardEditorStore(
    (s) => s.closeTemplateGallery,
  );
  const applyTemplate = useCardEditorStore((s) => s.applyTemplate);
  const activeTemplateId = useCardEditorStore((s) => s.activeTemplateId);

  return (
    <div
      className="absolute top-6 left-6 z-50 w-[340px] max-h-[85vh] flex flex-col"
      style={{
        background: 'rgba(10, 12, 22, 0.97)',
        backdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '20px',
        boxShadow:
          '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4 shrink-0 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <span className="text-purple-400">
            <Sparkles size={15} />
          </span>
          <div>
            <h3 className="text-sm font-bold text-white">
              نماذج الكروت الجاهزة
            </h3>
            <p className="text-[10px] text-slate-500 mt-0.5">
              اختر قالباً لتطبيقه على البطاقة
            </p>
          </div>
        </div>
        <button
          onClick={closeTemplateGallery}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.08] transition-all"
        >
          <X size={14} />
        </button>
      </div>

      {/* Grid */}
      <div
        className="overflow-y-auto p-4 flex-1"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(168,85,247,0.3) transparent',
        }}
      >
        <div className="grid grid-cols-2 gap-3">
          {TEMPLATES.map((tpl) => {
            const isActive = activeTemplateId === tpl.id;
            return (
              <button
                key={tpl.id}
                onClick={() => applyTemplate(tpl.id)}
                className="relative overflow-hidden rounded-xl transition-all duration-200 text-left group active:scale-95"
                style={{
                  height: '130px',
                  background: tpl.bg,
                  border: isActive
                    ? `2px solid ${tpl.accentColor}`
                    : '1.5px solid rgba(255,255,255,0.07)',
                  boxShadow: isActive
                    ? `0 0 20px ${tpl.accentColor}50, inset 0 0 24px ${tpl.accentColor}15`
                    : 'none',
                  transform: isActive ? 'scale(1.03)' : 'scale(1)',
                }}
              >
                {/* Mini art zone */}
                <div
                  className="absolute inset-x-3 top-3 h-[55px] rounded-lg overflow-hidden flex items-center justify-center"
                  style={{
                    background: `${tpl.accentColor}20`,
                    border: `1px solid ${tpl.accentColor}35`,
                  }}
                >
                  <span className="text-2xl opacity-60">{tpl.emoji}</span>
                </div>
                {/* Title mock */}
                <div
                  className="absolute left-3 right-3"
                  style={{
                    bottom: 28,
                    height: 6,
                    borderRadius: 99,
                    background: `${tpl.accentColor}40`,
                    width: '55%',
                    margin: 'auto',
                  }}
                />
                {/* Label row */}
                <div className="absolute inset-x-3 bottom-3 flex items-center justify-between">
                  <span
                    className="text-[10px] font-semibold"
                    style={{ color: tpl.accentColor }}
                  >
                    {tpl.label}
                  </span>
                  {isActive && (
                    <span className="text-[9px] bg-purple-500/30 border border-purple-500/50 text-purple-300 px-1.5 py-0.5 rounded-full font-medium">
                      ✓ مفعّل
                    </span>
                  )}
                </div>
                {/* Hover sheen */}
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/[0.05] transition-all rounded-xl" />
              </button>
            );
          })}
        </div>
        <p className="text-center text-[10px] text-slate-600 mt-4 pt-3 border-t border-white/[0.04]">
          انقر على أي قالب لتطبيقه فوراً
        </p>
      </div>
    </div>
  );
});
TemplateGallery.displayName = 'TemplateGallery';
