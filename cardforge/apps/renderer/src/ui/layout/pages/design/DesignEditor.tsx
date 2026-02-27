// and the right panel controls all card properties.
import { memo, useState, useCallback, useRef, type ChangeEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Layers,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  GripVertical,
  Sliders,
  Type,
  Sparkles,
  Palette,
  Image,
  ImagePlay,
  Film,
  Move,
} from 'lucide-react';
import { CardFrame } from '../../components/ui/CardFrame';
import type { Rarity, Element } from '../../components/ui/CardFrame';
import { TemplateGallery } from '../../components/ui/TemplateGallery';
import { Button } from '../../components/ui/Button';
import { RarityBadge } from '../../components/ui/Badge';
import { useCardEditor } from '../../../../hooks/useCardEditor';
import { useAppStore } from '../../../../state/appStore';
import {
  CARD_TEMPLATES,
  type TemplateKey,
} from '../../../../templates/cardTemplates';

// ── Constants ───────────────────────────────────────────────
const RARITIES: Rarity[] = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];
const ELEMENTS: Element[] = [
  'fire',
  'water',
  'nature',
  'dark',
  'light',
  'neutral',
];
const ELEMENT_LABELS: Record<Element, string> = {
  fire: '🔥 نار',
  water: '💧 ماء',
  nature: '🌿 طبيعة',
  dark: '🌑 ظلام',
  light: '✨ نور',
  neutral: '⚪ محايد',
};
const ALL_TRAITS = [
  'محارب',
  'ساحر',
  'طائر',
  'أسطوري',
  'شيطان',
  'ملاك',
  'حيوان',
  'آلي',
  'ماء',
  'نار',
  'متسلل',
  'دفاعي',
];

// Store handles layers now
// ── Panel wrappers ──────────────────────────────────────────
const Panel = ({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={`bg-white/[0.04] border border-white/[0.07] rounded-2xl overflow-hidden ${className}`}
  >
    {children}
  </div>
);
const PanelHeader = ({
  title,
  icon,
}: {
  title: string;
  icon: React.ReactNode;
}) => (
  <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06] bg-white/[0.03]">
    <span className="text-purple-400">{icon}</span>
    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
      {title}
    </span>
  </div>
);

// ── Left Panel ──────────────────────────────────────────────
const LeftPanel = memo(() => {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const gifInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const {
    layers,
    activeLayerId,
    isTransformMode,
    imageUrl,
    imageScale,
    imageOpacity,
    imageBrightness,
    setTransformMode,
    setImageUrl,
    setImageScale,
    setImageOpacity,
    setImageBrightness,
    resetImageSettings,
    setActiveLayerId,
    toggleLayerVisibility,
    addLayer,
    removeLayer,
    clearArtImage,
  } = useCardEditor();

  const LAYER_ICONS: Record<string, React.ReactNode> = {
    art: <Image size={11} />,
    text: <Type size={11} />,
    element: <Sparkles size={11} />,
    stats: <Sliders size={11} />,
    image: <Image size={11} />,
  };

  const handleMediaUpload = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        if (typeof loadEvent.target?.result === 'string') {
          setImageUrl(loadEvent.target.result);
        }
      };
      reader.readAsDataURL(file);
      event.target.value = '';
    },
    [setImageUrl],
  );

  return (
    <div className="h-full flex flex-col gap-3 p-3 overflow-y-auto pointer-events-auto">
      <Panel className="flex-1">
        <PanelHeader title="الطبقات" icon={<Layers size={13} />} />
        <div className="p-2 flex flex-col gap-1">
          {/* Special Art Zone Layer (conditionally rendered) */}
          {imageUrl && (
            <div
              onClick={() => setActiveLayerId('main-art-image')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl group transition-colors cursor-pointer ${activeLayerId === 'main-art-image' ? 'bg-purple-500/20 border border-purple-500/30' : 'hover:bg-white/[0.06] border border-transparent'}`}
            >
              <div className="w-3" />{' '}
              {/* Spacer for grip area since we can't drag it */}
              <span
                className={`${activeLayerId === 'main-art-image' ? 'text-purple-400' : 'text-slate-500 group-hover:text-slate-400'} text-[10px]`}
              >
                <Image size={11} />
              </span>
              <span
                className={`flex-1 text-xs truncate ${activeLayerId === 'main-art-image' ? 'text-white font-medium' : 'text-slate-300'}`}
              >
                الفن الرئيسي
              </span>
              <Eye size={11} className="text-slate-600 opacity-50" />
            </div>
          )}

          {layers.map((layer) => (
            <div
              key={layer.id}
              onClick={() => setActiveLayerId(layer.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl group transition-colors cursor-pointer ${activeLayerId === layer.id ? 'bg-purple-500/20 border border-purple-500/30' : 'hover:bg-white/[0.06] border border-transparent'}`}
            >
              <GripVertical
                size={12}
                className="text-slate-600 group-hover:text-slate-400 cursor-grab"
              />
              <span
                className={`${activeLayerId === layer.id ? 'text-purple-400' : 'text-slate-500 group-hover:text-slate-400'} text-[10px]`}
              >
                {LAYER_ICONS[layer.type] || <Layers size={11} />}
              </span>
              <span
                className={`flex-1 text-xs truncate ${activeLayerId === layer.id ? 'text-white font-medium' : 'text-slate-300'}`}
              >
                {layer.name}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleLayerVisibility(layer.id);
                }}
                className={`transition-colors ${activeLayerId === layer.id ? 'text-purple-300 hover:text-white opacity-100' : 'text-slate-600 hover:text-slate-300 opacity-0 group-hover:opacity-100'}`}
              >
                {layer.visible ? <Eye size={11} /> : <EyeOff size={11} />}
              </button>
            </div>
          ))}
          <button
            onClick={() =>
              addLayer({ name: 'طبقة جديدة', type: 'art', visible: true })
            }
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-600 hover:text-slate-400 hover:bg-white/[0.04] transition-colors mt-1 active:scale-95"
          >
            <Plus size={11} />
            <span className="text-xs">إضافة طبقة</span>
          </button>
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="الأدوات" icon={<Palette size={13} />} />
        <div className="p-3 grid grid-cols-4 gap-2">
          {/* Hidden media uploads for Main Art Zone */}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            ref={imageInputRef}
            className="hidden"
            onChange={handleMediaUpload}
          />
          <input
            type="file"
            accept="image/gif"
            ref={gifInputRef}
            className="hidden"
            onChange={handleMediaUpload}
          />
          <input
            type="file"
            accept="video/mp4,video/webm"
            ref={videoInputRef}
            className="hidden"
            onChange={handleMediaUpload}
          />

          <button
            onClick={() => setTransformMode(!isTransformMode)}
            className={`flex flex-col items-center gap-1 py-2 rounded-xl border transition-all active:scale-95 ${isTransformMode
                ? 'bg-purple-500/20 border-purple-500/30 text-purple-400'
                : 'bg-white/[0.03] hover:bg-white/[0.08] border-white/[0.05] hover:border-white/[0.12] text-slate-400 hover:text-slate-200'
              }`}
          >
            <Move size={14} />
            <span className="text-[8px]">تحريك</span>
          </button>
          <button
            onClick={() =>
              addLayer({ name: 'نص جديد', type: 'text', visible: true })
            }
            className="flex flex-col items-center gap-1 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.05] hover:border-white/[0.12] transition-all text-slate-400 hover:text-slate-200 active:scale-95"
          >
            <Type size={14} />
            <span className="text-[8px]">نص</span>
          </button>
          <button
            onClick={() => imageInputRef.current?.click()}
            className="flex flex-col items-center gap-1 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.05] hover:border-white/[0.12] transition-all text-slate-400 hover:text-slate-200 active:scale-95"
          >
            <Image size={14} />
            <span className="text-[8px]">صورة</span>
          </button>
          <button
            onClick={() => gifInputRef.current?.click()}
            className="flex flex-col items-center gap-1 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.05] hover:border-white/[0.12] transition-all text-slate-400 hover:text-slate-200 active:scale-95"
          >
            <ImagePlay size={14} />
            <span className="text-[8px]">Ù…ØªØ­Ø±ÙƒØ©</span>
          </button>
          <button
            onClick={() => videoInputRef.current?.click()}
            className="flex flex-col items-center gap-1 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.05] hover:border-white/[0.12] transition-all text-slate-400 hover:text-slate-200 active:scale-95"
          >
            <Film size={14} />
            <span className="text-[8px]">ÙÙŠØ¯ÙŠÙˆ</span>
          </button>
          <button
            onClick={() => console.log('Open Effect Panel')}
            className="flex flex-col items-center gap-1 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.05] hover:border-white/[0.12] transition-all text-slate-400 hover:text-slate-200 active:scale-95"
          >
            <Sparkles size={14} />
            <span className="text-[8px]">تأثير</span>
          </button>
          <button
            onClick={() => console.log('Open Filter Panel')}
            className="flex flex-col items-center gap-1 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.05] hover:border-white/[0.12] transition-all text-slate-400 hover:text-slate-200 active:scale-95"
          >
            <Sliders size={14} />
            <span className="text-[8px]">فلتر</span>
          </button>
          <button
            onClick={() => {
              if (activeLayerId === 'main-art-image') {
                clearArtImage();
              } else if (activeLayerId) {
                removeLayer(activeLayerId);
              }
            }}
            disabled={!activeLayerId}
            className="flex flex-col items-center gap-1 py-2 rounded-xl bg-white/[0.03] hover:bg-red-500/10 border border-white/[0.05] hover:border-red-500/30 transition-all text-slate-400 hover:text-red-400 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 size={14} />
            <span className="text-[8px]">حذف</span>
          </button>
        </div>
      </Panel>
      <Panel>
        <PanelHeader title="إعدادات الصورة" icon={<Sliders size={13} />} />
        <div className="p-3 flex flex-col gap-3">
          <div>
            <div className="mb-1 flex items-center justify-between text-[10px]">
              <span className="text-slate-400">تكبير</span>
              <span className="font-bold text-slate-200">
                {imageScale.toFixed(1)}x
              </span>
            </div>
            <input
              type="range"
              min={0.5}
              max={2.5}
              step={0.1}
              value={imageScale}
              onChange={(e) => setImageScale(parseFloat(e.target.value))}
              className="w-full h-1.5 rounded-full accent-purple-500 cursor-pointer"
            />
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between text-[10px]">
              <span className="text-slate-400">شفافية</span>
              <span className="font-bold text-slate-200">
                {imageOpacity.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min={0.1}
              max={1}
              step={0.05}
              value={imageOpacity}
              onChange={(e) => setImageOpacity(parseFloat(e.target.value))}
              className="w-full h-1.5 rounded-full accent-purple-500 cursor-pointer"
            />
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between text-[10px]">
              <span className="text-slate-400">إضاءة</span>
              <span className="font-bold text-slate-200">
                {imageBrightness.toFixed(1)}
              </span>
            </div>
            <input
              type="range"
              min={0.2}
              max={2}
              step={0.1}
              value={imageBrightness}
              onChange={(e) => setImageBrightness(parseFloat(e.target.value))}
              className="w-full h-1.5 rounded-full accent-purple-500 cursor-pointer"
            />
          </div>

          <button
            onClick={resetImageSettings}
            className="mt-1 rounded-xl border border-white/[0.12] bg-white/[0.04] px-3 py-2 text-xs font-semibold text-slate-300 transition-all hover:border-purple-500/40 hover:bg-purple-500/10 hover:text-purple-300 active:scale-95"
          >
            إعادة تعيين
          </button>
        </div>
      </Panel>
    </div>
  );
});
LeftPanel.displayName = 'LeftPanel';

// ── Center Canvas ───────────────────────────────────────────
const CenterCanvas = memo(() => {
  const {
    cardData,
    isTransformMode,
    badgePositions,
    activeLayerId,
    setActiveLayerId,
    updateBadgePosition,
    showDescription,
    artZoneHeight,
    isTemplateGalleryOpen,
    activeTemplateId,
    zoomLevel,
    zoomIn,
    zoomOut,
    resetZoom,
  } = useCardEditor();

  const currentTemplate =
    CARD_TEMPLATES[activeTemplateId as TemplateKey] || CARD_TEMPLATES.classic;

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-center gap-2 py-2 border-b border-white/[0.06] bg-black/20 px-4 shrink-0">
        <Button size="xs" variant="ghost" onClick={zoomOut}>
          −
        </Button>
        <span className="text-xs text-slate-400 w-10 text-center">
          {Math.round(zoomLevel * 100)}%
        </span>
        <Button size="xs" variant="ghost" onClick={zoomIn}>
          +
        </Button>
        <div className="w-px h-4 bg-white/10 mx-1" />
        <Button size="xs" variant="ghost" onClick={resetZoom}>
          تهيئة
        </Button>
        {isTransformMode && (
          <span className="text-[10px] text-purple-400 font-semibold animate-pulse ml-2">
            ✦ وضع التحريك
          </span>
        )}
      </div>

      {/* Canvas */}
      <div className="flex-1 flex items-center justify-center overflow-hidden bg-[#070b14] relative">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Template Gallery (فلواتس أبسولوت inside canvas) */}
        {isTemplateGalleryOpen && <TemplateGallery />}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTemplateId || 'default'}
            style={{
              transform: `scale(${zoomLevel})`,
              transformOrigin: 'center center',
              transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            className="drop-shadow-2xl"
            initial={{ opacity: 0.8, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0.8, scale: 0.98 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            <CardFrame
              data={cardData}
              showGlow
              showStats
              isTransformMode={isTransformMode}
              badgePositions={badgePositions}
              activeBadgeId={activeLayerId}
              onBadgeSelect={(badge) => setActiveLayerId(`badge-${badge}`)}
              onBadgeMove={updateBadgePosition}
              showDescription={showDescription}
              artZoneHeight={artZoneHeight}
              layout={currentTemplate.layout || 'standard'}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
});
CenterCanvas.displayName = 'CenterCanvas';

// ── Right Properties Panel ──────────────────────────────────
const RightPanel = memo(() => {
  const [tab, setTab] = useState<
    'card' | 'stats' | 'text' | 'traits' | 'template'
  >('card');
  const {
    cardData,
    setTitle,
    setDescription,
    setElement,
    setRarity,
    setAttack,
    setHp,
    setCost,
    toggleTrait,
    layers,
    activeLayerId,
    isTransformMode,
    setTransformMode,
    bringLayerForward,
    sendLayerBackward,
    showDescription,
    artZoneHeight,
    toggleDescription,
    setArtZoneHeight,
    toggleTemplateGallery,
    markClean,
  } = useCardEditor();
  const saveCard = useAppStore((state) => state.saveCard);

  const TABS = [
    { id: 'card' as const, label: 'البطاقة' },
    { id: 'stats' as const, label: 'إحصائيات' },
    { id: 'text' as const, label: 'نصوص' },
    { id: 'traits' as const, label: 'سمات' },
    { id: 'template' as const, label: 'قالب' },
  ];

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-white/[0.06] bg-black/20 px-2 pt-2 gap-1 shrink-0 overflow-x-auto no-scrollbar">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-t-xl transition-all whitespace-nowrap
              ${tab === id ? 'bg-white/[0.08] text-slate-200 border-b-2 border-purple-500' : 'text-slate-500 hover:text-slate-300'}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
        {/* ── Card tab ── */}
        {tab === 'card' && (
          <>
            <Panel>
              <PanelHeader title="الندرة" icon={<Sparkles size={13} />} />
              <div className="p-3 grid grid-cols-1 gap-1.5">
                {RARITIES.map((r) => (
                  <button
                    key={r}
                    onClick={() => setRarity(r)}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all
                    ${cardData.rarity === r
                        ? 'bg-purple-600/30 border border-purple-500/50 text-purple-200'
                        : 'bg-white/[0.03] border border-white/[0.06] text-slate-400 hover:bg-white/[0.07] hover:text-slate-200'
                      }`}
                  >
                    <RarityBadge rarity={r} />
                    {cardData.rarity === r && (
                      <span className="text-purple-400">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </Panel>

            <Panel>
              <PanelHeader title="العنصر" icon={<Palette size={13} />} />
              <div className="p-3 grid grid-cols-3 gap-1.5">
                {ELEMENTS.map((el) => (
                  <button
                    key={el}
                    onClick={() => setElement(el)}
                    className={`py-2 rounded-xl text-[10px] font-medium transition-all text-center
                    ${cardData.element === el
                        ? 'bg-purple-600/30 border border-purple-500/50 text-white'
                        : 'bg-white/[0.03] border border-white/[0.06] text-slate-400 hover:bg-white/[0.07]'
                      }`}
                  >
                    {ELEMENT_LABELS[el]}
                  </button>
                ))}
              </div>
            </Panel>

            {/* ★ Template Gallery trigger button — placed exactly between العنصر and تخطيط البطاقة */}
            <button
              onClick={toggleTemplateGallery}
              className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white transition-all active:scale-95 hover:scale-[1.02] bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-lg"
              style={{
                boxShadow:
                  '0 0 20px rgba(139,92,246,0.35), 0 4px 14px rgba(0,0,0,0.4)',
              }}
            >
              استعراض معرض القوالب 🎨
            </button>

            <Panel>
              <PanelHeader title="تخطيط البطاقة" icon={<Sliders size={13} />} />
              <div className="p-3 flex flex-col gap-4">
                {/* Art Zone Height Slider */}
                <div>
                  <div className="flex justify-between mb-1.5">
                    <span className="text-[10px] text-slate-400">
                      🖼️ ارتفاع الصورة
                    </span>
                    <span className="text-[10px] font-bold text-slate-200">
                      {artZoneHeight}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min={80}
                    max={260}
                    value={artZoneHeight}
                    onChange={(e) => setArtZoneHeight(parseInt(e.target.value))}
                    className="w-full h-1.5 rounded-full accent-purple-500 cursor-pointer"
                  />
                </div>
                {/* Show Description Toggle */}
                <button
                  onClick={toggleDescription}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all text-xs font-medium ${showDescription
                      ? 'bg-purple-500/15 border-purple-500/40 text-purple-300'
                      : 'bg-white/[0.03] border-white/[0.06] text-slate-500'
                    }`}
                >
                  <span>إظهار الوصف</span>
                  <span
                    className={`w-8 h-4 rounded-full relative transition-all ${showDescription ? 'bg-purple-500' : 'bg-slate-700'
                      }`}
                  >
                    <span
                      className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-all ${showDescription ? 'right-0.5' : 'left-0.5'
                        }`}
                    />
                  </span>
                </button>
              </div>
            </Panel>

            <Panel>
              <PanelHeader
                title="أدوات العنصر المحددة"
                icon={<Move size={13} />}
              />
              <div className="p-3 flex flex-col gap-3">
                <span className="text-[10px] text-slate-400 font-medium">
                  {activeLayerId
                    ? `العنصر المحدد: ${layers.find((l) => l.id === activeLayerId)?.name || (activeLayerId === 'main-art-image' ? 'الفن الرئيسي' : 'غير معروف')}`
                    : 'لا يوجد عنصر محدد'}
                </span>
                <Button
                  variant={isTransformMode ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setTransformMode(!isTransformMode)}
                  className={`w-full ${isTransformMode ? 'bg-purple-600 hover:bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.4)] border-purple-400' : ''}`}
                >
                  وضع التحريك
                </Button>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() =>
                      activeLayerId && bringLayerForward(activeLayerId)
                    }
                    disabled={
                      !activeLayerId || activeLayerId === 'main-art-image'
                    }
                  >
                    إحضار للأمام
                  </Button>
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() =>
                      activeLayerId && sendLayerBackward(activeLayerId)
                    }
                    disabled={
                      !activeLayerId || activeLayerId === 'main-art-image'
                    }
                  >
                    إرسال للخلف
                  </Button>
                </div>
              </div>
            </Panel>
          </>
        )}

        {/* ── Stats tab ── */}
        {tab === 'stats' && (
          <>
            <Panel>
              <PanelHeader title="القوة" icon={<Sliders size={13} />} />
              <div className="p-3 flex flex-col gap-3">
                {(
                  [
                    ['attack', '⚔️ هجوم', cardData.attack, setAttack, 100],
                    ['hp', '❤️ صحة', cardData.hp, setHp, 100],
                    ['cost', '💎 تكلفة', cardData.cost, setCost, 10],
                  ] as const
                ).map(([key, label, val, setter, max]) => (
                  <div key={key}>
                    <div className="flex justify-between mb-1">
                      <span className="text-[10px] text-slate-400">
                        {label}
                      </span>
                      <span className="text-[10px] font-bold text-slate-200">
                        {val}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={max}
                      value={val}
                      onChange={(e) => setter(parseInt(e.target.value))}
                      className="w-full h-1.5 rounded-full accent-purple-500 cursor-pointer"
                    />
                  </div>
                ))}
              </div>
            </Panel>
          </>
        )}

        {/* ── Text tab ── */}
        {tab === 'text' && (
          <>
            <Panel>
              <PanelHeader title="الاسم" icon={<Type size={13} />} />
              <div className="p-3">
                <input
                  value={cardData.title ?? ''}
                  onChange={(e) => setTitle(e.target.value)}
                  dir="rtl"
                  placeholder="اسم البطاقة..."
                  className="w-full px-3 py-2 text-sm bg-white/[0.05] border border-white/[0.1] rounded-xl
                  text-slate-200 placeholder-slate-600 focus:outline-none focus:border-purple-500/50 transition-all text-right"
                />
              </div>
            </Panel>
            <Panel>
              <PanelHeader title="الوصف" icon={<Type size={13} />} />
              <div className="p-3">
                <textarea
                  value={cardData.description ?? ''}
                  onChange={(e) => setDescription(e.target.value)}
                  dir="rtl"
                  rows={4}
                  placeholder="وصف البطاقة..."
                  className="w-full px-3 py-2 text-sm bg-white/[0.05] border border-white/[0.1] rounded-xl
                  text-slate-200 placeholder-slate-600 focus:outline-none focus:border-purple-500/50 transition-all text-right resize-none"
                />
              </div>
            </Panel>
          </>
        )}

        {/* ── Traits tab ── */}
        {tab === 'traits' && (
          <Panel>
            <PanelHeader title="السمات" icon={<Layers size={13} />} />
            <div className="p-3 flex flex-wrap gap-2">
              {ALL_TRAITS.map((t) => {
                const on = (cardData.traits ?? []).includes(t);
                return (
                  <button
                    key={t}
                    onClick={() => toggleTrait(t)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all
                      ${on ? 'bg-purple-600/40 border-purple-500/60 text-purple-200' : 'bg-white/[0.04] border-white/[0.08] text-slate-400 hover:bg-white/[0.08] hover:text-slate-200'}`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </Panel>
        )}

        {/* ── Template tab ── */}
        {tab === 'template' && (
          <Panel>
            <PanelHeader title="القوالب" icon={<Sparkles size={13} />} />
            <div className="p-3 grid grid-cols-2 gap-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {['كلاسيك', 'حديث', 'أسطوري', 'سايبربنك', 'عربي', 'طبيعة', 'دم', 'عين', 'خلل', 'مستنقع', 'إيلف', 'نيون'].map(
                (tpl) => (
                  <button
                    key={tpl}
                    className="flex items-center justify-center py-3 rounded-xl bg-white/[0.04] border border-white/[0.08]
                    text-xs text-slate-400 hover:bg-purple-600/20 hover:border-purple-500/40 hover:text-purple-300 transition-all"
                  >
                    {tpl}
                  </button>
                ),
              )}
            </div>
          </Panel>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-white/[0.06] bg-black/20 flex gap-2 shrink-0">
        <Button
          variant="success"
          size="sm"
          fullWidth
          onClick={() => {
            saveCard(cardData);
            markClean();
          }}
        >
          حفظ في المجموعة
        </Button>
        <Button
          variant="primary"
          size="sm"
          fullWidth
          icon={<Sparkles size={13} />}
        >
          توليد بالذكاء الاصطناعي
        </Button>
      </div>
    </div>
  );
});
RightPanel.displayName = 'RightPanel';

// ══ Main DesignEditor ═══════════════════════════════════════
export const DesignEditor = memo(() => {
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);

  return (
    <div className="h-full flex flex-row overflow-hidden bg-[#070a14]">
      {/* ── Left Panel ── */}
      <aside
        className="relative z-50 pointer-events-auto shrink-0 flex flex-col border-r border-white/[0.06] bg-[#0b0e1a] transition-all duration-300"
        style={{ width: leftOpen ? 240 : 0, minWidth: leftOpen ? 220 : 0 }}
      >
        <LeftPanel />
      </aside>

      {/* Left collapse button */}
      <button
        onClick={() => setLeftOpen((p) => !p)}
        className="z-10 self-center shrink-0 w-5 h-10 flex items-center justify-center
          bg-[#0d1120] border border-white/[0.07] rounded-r-lg
          text-slate-500 hover:text-slate-300 hover:bg-white/[0.06] transition-all"
      >
        {leftOpen ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
      </button>

      {/* ── Center Canvas ── */}
      <main className="flex-1 min-w-0 overflow-hidden">
        <CenterCanvas />
      </main>

      {/* Right collapse button */}
      <button
        onClick={() => setRightOpen((p) => !p)}
        className="z-10 self-center shrink-0 w-5 h-10 flex items-center justify-center
          bg-[#0d1120] border border-white/[0.07] rounded-l-lg
          text-slate-500 hover:text-slate-300 hover:bg-white/[0.06] transition-all"
      >
        {rightOpen ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      {/* ── Right Panel ── */}
      <aside
        className="relative z-20 shrink-0 flex flex-col border-l border-white/[0.06] bg-[#0b0e1a] transition-all duration-300"
        style={{ width: rightOpen ? 280 : 0, minWidth: rightOpen ? 260 : 0 }}
      >
        <RightPanel />
      </aside>
    </div>
  );
});
DesignEditor.displayName = 'DesignEditor';
