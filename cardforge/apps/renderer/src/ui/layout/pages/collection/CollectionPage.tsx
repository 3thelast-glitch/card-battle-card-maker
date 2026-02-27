// src/ui/layout/pages/collection/CollectionPage.tsx
import { memo, useState, useMemo, useCallback, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  Search,
  Filter,
  Grid3X3,
  List,
  Download,
  Trash2,
  CheckSquare,
  Square,
  Archive,
  SortAsc,
  FileSpreadsheet,
  FileDown,
} from 'lucide-react';
import { CardFrame } from '../../components/ui/CardFrame';
import type {
  CardFrameData,
  Rarity,
  Element,
} from '../../components/ui/CardFrame';
import { Button } from '../../components/ui/Button';
import { RarityBadge, ElementBadge } from '../../components/ui/Badge';
import { useAppStore } from '../../../../state/appStore';

const ELEMENTS_ALL: Element[] = [
  'fire',
  'water',
  'nature',
  'dark',
  'light',
  'neutral',
];
const RARITIES_ALL: Rarity[] = [
  'Common',
  'Uncommon',
  'Rare',
  'Epic',
  'Legendary',
];

type ViewMode = 'grid' | 'list';
type SortField = 'title' | 'rarity' | 'attack' | 'hp';

const RARITY_ORDER: Record<Rarity, number> = {
  Common: 0,
  Uncommon: 1,
  Rare: 2,
  Epic: 3,
  Legendary: 4,
};

// ── Card thumbnail ─────────────────────────────────────────
const CardThumbnail = memo(
  ({
    card,
    selected,
    onSelect,
    onOpen,
    onRemove,
  }: {
    card: CardFrameData & { id: string };
    selected: boolean;
    onSelect: (id: string) => void;
    onOpen: (id: string) => void;
    onRemove: (id: string) => void;
  }) => (
    <div
      className={`group relative flex flex-col gap-2 p-3 rounded-2xl cursor-pointer transition-all duration-200
      ${selected
          ? 'bg-purple-600/20 border border-purple-500/50 ring-2 ring-purple-500/30'
          : 'bg-white/[0.04] border border-white/[0.07] hover:bg-white/[0.07] hover:border-white/[0.12]'
        }`}
      onClick={() => onOpen(card.id)}
    >
      {/* Select checkbox */}
      <button
        className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => {
          e.stopPropagation();
          onSelect(card.id);
        }}
      >
        {selected ? (
          <CheckSquare size={16} className="text-purple-400" />
        ) : (
          <Square size={16} className="text-slate-600" />
        )}
      </button>

      <button
        className="absolute top-2 left-2 z-50 p-2 bg-red-900/80 text-red-200 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 hover:scale-110 shadow-lg border border-red-500/50"
        onClick={(e) => {
          e.stopPropagation();
          if (window.confirm('هل أنت متأكد من حذف هذه البطاقة نهائياً؟')) {
            onRemove(card.id);
          }
        }}
        aria-label="حذف البطاقة"
        title="حذف البطاقة"
      >
        <Trash2 size={16} />
      </button>

      <div className="flex justify-center">
        <CardFrame card={card} data={card} scale={0.37} showGlow={selected} showStats />
      </div>
      <div className="text-center">
        <div className="text-xs font-bold text-slate-200 truncate">
          {card.title}
        </div>
        <div className="flex items-center justify-center gap-1 mt-1.5 flex-wrap">
          <RarityBadge rarity={card.rarity ?? 'Common'} />
          <ElementBadge element={card.element ?? 'neutral'} />
        </div>
        <div className="flex items-center justify-center gap-3 mt-2 text-[9px] text-slate-500">
          <span>⚔️ {card.attack}</span>
          <span>❤️ {card.hp}</span>
          <span>💎 {card.cost}</span>
        </div>
      </div>
    </div>
  ),
);
CardThumbnail.displayName = 'CardThumbnail';

// ── List row ───────────────────────────────────────────────
const CardListRow = memo(
  ({
    card,
    selected,
    onSelect,
    onOpen,
    onRemove,
  }: {
    card: CardFrameData & { id: string };
    selected: boolean;
    onSelect: (id: string) => void;
    onOpen: (id: string) => void;
    onRemove: (id: string) => void;
  }) => (
    <div
      className={`group relative flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer transition-all
      ${selected
          ? 'bg-purple-600/15 border border-purple-500/40'
          : 'bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06]'
        }`}
      onClick={() => onOpen(card.id)}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onSelect(card.id);
        }}
        className="shrink-0 text-slate-600 hover:text-purple-400 transition-colors"
      >
        {selected ? (
          <CheckSquare size={14} className="text-purple-400" />
        ) : (
          <Square size={14} />
        )}
      </button>
      <button
        className="absolute top-2 left-2 z-50 p-2 bg-red-900/80 text-red-200 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 hover:scale-110 shadow-lg border border-red-500/50"
        onClick={(e) => {
          e.stopPropagation();
          if (window.confirm('هل أنت متأكد من حذف هذه البطاقة نهائياً؟')) {
            onRemove(card.id);
          }
        }}
        aria-label="حذف البطاقة"
        title="حذف البطاقة"
      >
        <Trash2 size={16} />
      </button>
      <CardFrame card={card} data={card} scale={0.12} showGlow={false} showStats={false} />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold text-slate-200 truncate">
          {card.title}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <RarityBadge rarity={card.rarity ?? 'Common'} />
          <ElementBadge element={card.element ?? 'neutral'} />
          {(card.traits ?? []).slice(0, 2).map((t) => (
            <span
              key={t}
              className="text-[9px] text-slate-500 bg-white/[0.04] px-2 py-0.5 rounded-full border border-white/[0.06]"
            >
              {t}
            </span>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-4 text-xs text-slate-400 shrink-0">
        <span className="text-right">
          <span className="text-[9px] text-slate-600">هجوم </span>
          {card.attack}
        </span>
        <span className="text-right">
          <span className="text-[9px] text-slate-600">صحة </span>
          {card.hp}
        </span>
        <span className="text-right">
          <span className="text-[9px] text-slate-600">تكلفة </span>
          {card.cost}
        </span>
      </div>
    </div>
  ),
);
CardListRow.displayName = 'CardListRow';

// ══ Main CollectionPage ═════════════════════════════════════
export const CollectionPage = memo(() => {
  const { collection, addCards, removeCard, removeMultipleCards } = useAppStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState('');
  const [filterElement, setFilterElement] = useState<Element | 'all'>('all');
  const [filterRarity, setFilterRarity] = useState<Rarity | 'all'>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sort, setSort] = useState<SortField>('rarity');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    return collection.filter((c: CardFrameData & { id: string }) => {
      const q = search.toLowerCase();
      if (
        q &&
        !c.title?.toLowerCase().includes(q) &&
        !c.description?.toLowerCase().includes(q)
      )
        return false;
      if (filterElement !== 'all' && c.element !== filterElement) return false;
      if (filterRarity !== 'all' && c.rarity !== filterRarity) return false;
      return true;
    }).sort((a: CardFrameData & { id: string }, b: CardFrameData & { id: string }) => {
      if (sort === 'rarity')
        return (
          (RARITY_ORDER[b.rarity ?? 'Common'] ?? 0) -
          (RARITY_ORDER[a.rarity ?? 'Common'] ?? 0)
        );
      if (sort === 'attack') return (b.attack ?? 0) - (a.attack ?? 0);
      if (sort === 'hp') return (b.hp ?? 0) - (a.hp ?? 0);
      return (a.title ?? '').localeCompare(b.title ?? '', 'ar');
    });
  }, [search, filterElement, filterRarity, sort]);

  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  }, []);

  const toggleAll = useCallback(() => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((c: CardFrameData & { id: string }) => c.id)));
  }, [selected.size, filtered]);

  const openCard = useCallback((_id: string) => {
    // TODO: navigate to design editor with this card
  }, []);

  const handleRemoveCard = useCallback(
    (id: string) => {
      removeCard(id);
      setSelected((prev) => {
        if (!prev.has(id)) return prev;
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    },
    [removeCard],
  );

  const handleBulkDelete = useCallback(() => {
    if (selected.size === 0) return;
    if (window.confirm(`هل أنت متأكد من حذف ${selected.size} بطاقات نهائياً؟`)) {
      removeMultipleCards(Array.from(selected));
      setSelected(new Set());
    }
  }, [selected, removeMultipleCards]);

  const anySelected = selected.size > 0;
  const allSelected = selected.size === filtered.length && filtered.length > 0;

  // ── Excel/CSV Import Logic ──
  const triggerImport = () => {
    fileInputRef.current?.click();
  };

  const handleExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const data = event.target?.result as ArrayBuffer;
      if (!data) return;

      try {
        const workbook = XLSX.read(data, { type: 'array' });
        const newCards: (CardFrameData & { id: string })[] = [];

        workbook.SheetNames.forEach((sheetName) => {
          const sheetRows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { raw: false }) as Record<string, any>[];

          sheetRows.forEach((row) => {
            // Case-insensitive key lookup helper for user-provided excel headers
            const getVal = (keys: string[]) => {
              for (const k of Object.keys(row)) {
                if (keys.includes(k.toLowerCase().trim())) {
                  return String(row[k]).trim();
                }
              }
              return undefined;
            };

            const title = getVal(['name', 'title']) || 'بدون اسم';

            // Allow empty or skip entirely empty rows
            if (!getVal(['name', 'title']) && !getVal(['description']) && !getVal(['attack'])) return;

            const card: CardFrameData & { id: string } = {
              id: `card_${crypto.randomUUID()}`,
              title,
              description: getVal(['description']) || '',
              attack: parseInt(getVal(['attack']) || '0', 10),
              hp: parseInt(getVal(['health', 'hp']) || '0', 10),
              cost: parseInt(getVal(['stars', 'cost']) || '1', 10),
              rarity: (getVal(['rarity']) as Rarity) || 'Common',
              element: (getVal(['element']) as Element) || 'neutral',
              imageUrl: getVal(['image_url', 'imageurl', 'image']) || undefined,
            };

            newCards.push(card);
          });
        });

        if (newCards.length > 0) {
          addCards(newCards);
          alert(`تم استيراد ${newCards.length} بطاقة من ${workbook.SheetNames.length} صفحات بنجاح!`);
        } else {
          alert('لم يتم العثور على أي بطاقات صالحة في الملف.');
        }
      } catch (err: any) {
        alert('حدث خطأ أثناء قراءة الملف: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
    // Reset file input so same file can be chosen again
    e.target.value = '';
  };

  const handleDownloadTemplate = useCallback(() => {
    const workbook = XLSX.utils.book_new();

    const sheets = [
      {
        name: 'عادي',
        data: [
          { name: 'جندي الحرس', attack: 20, health: 30, stars: 1, rarity: 'عادي', element: 'محايد', description: 'جندي مخلص.', template: 'classic', image_url: '' }
        ],
      },
      {
        name: 'غير شائع',
        data: [
          { name: 'قناص الرياح', attack: 45, health: 25, stars: 3, rarity: 'غير شائع', element: 'هواء', description: 'دقة عالية.', template: 'classic', image_url: '' }
        ],
      },
      {
        name: 'نادر',
        data: [
          { name: 'ساحر الظلام', attack: 70, health: 40, stars: 4, rarity: 'نادر', element: 'ظلام', description: 'سحر أسود.', template: 'blood-ritual', image_url: '' }
        ],
      },
      {
        name: 'ملحمي',
        data: [
          { name: 'سيد المستنقع', attack: 85, health: 120, stars: 6, rarity: 'ملحمي', element: 'ماء', description: 'وحش برمائي.', template: 'swamp', image_url: '' }
        ],
      },
      {
        name: 'أسطوري',
        data: [
          { name: 'فيانور', attack: 180, health: 150, stars: 7, rarity: 'أسطوري', element: 'نور', description: 'أمير الغابة الأزلية.', template: 'elven-luxury', image_url: '' },
          { name: 'عين الهاوية', attack: 160, health: 200, stars: 7, rarity: 'أسطوري', element: 'ظلام', description: 'مراقب الكون.', template: 'eldritch-eye', image_url: '' }
        ],
      },
    ];

    sheets.forEach((sheet) => {
      const worksheet = XLSX.utils.json_to_sheet(sheet.data);
      XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
    });

    XLSX.writeFile(workbook, 'Cards_Database_Template.xlsx');
  }, []);

  return (
    <div className="h-full flex flex-col overflow-hidden bg-[#070a14]">
      {/* Hidden file input for Excel upload */}
      <input
        type="file"
        accept=".xlsx, .xls, .csv"
        ref={fileInputRef}
        onChange={handleExcelImport}
        className="hidden"
      />

      {/* ── Top controls bar ── */}
      <div className="px-4 py-3 border-b border-white/[0.06] bg-[#0b0e1a] flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search
            size={13}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث عن بطاقة..."
            dir="rtl"
            className="w-full pr-9 pl-3 py-2 text-xs bg-white/[0.05] border border-white/[0.1] rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-purple-500/50 transition-all"
          />
        </div>

        {/* Element filter */}
        <div className="flex items-center gap-1 bg-white/[0.04] border border-white/[0.07] rounded-xl px-2 py-1">
          <Filter size={10} className="text-slate-500" />
          <select
            value={filterElement}
            onChange={(e) => setFilterElement(e.target.value as any)}
            className="text-[10px] bg-transparent text-slate-300 outline-none cursor-pointer pr-1"
          >
            <option value="all">الكل</option>
            {ELEMENTS_ALL.map((el) => (
              <option key={el} value={el}>
                {el}
              </option>
            ))}
          </select>
        </div>

        {/* Rarity filter */}
        <div className="flex items-center gap-1 bg-white/[0.04] border border-white/[0.07] rounded-xl px-2 py-1">
          <select
            value={filterRarity}
            onChange={(e) => setFilterRarity(e.target.value as any)}
            className="text-[10px] bg-transparent text-slate-300 outline-none cursor-pointer"
          >
            <option value="all">كل الندرة</option>
            {RARITIES_ALL.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-1 bg-white/[0.04] border border-white/[0.07] rounded-xl px-2 py-1">
          <SortAsc size={10} className="text-slate-500" />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortField)}
            className="text-[10px] bg-transparent text-slate-300 outline-none cursor-pointer"
          >
            <option value="rarity">ترتيب: الندرة</option>
            <option value="title">ترتيب: الاسم</option>
            <option value="attack">ترتيب: الهجوم</option>
            <option value="hp">ترتيب: الصحة</option>
          </select>
        </div>

        {/* View mode */}
        <div className="flex items-center bg-white/[0.04] border border-white/[0.07] rounded-xl mr-auto">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-purple-600/40 text-purple-300' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Grid3X3 size={13} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-purple-600/40 text-purple-300' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <List size={13} />
          </button>
        </div>

        {/* Download Template Button */}
        <Button
          variant="outline"
          size="sm"
          icon={<FileDown size={14} />}
          onClick={handleDownloadTemplate}
          className="border-white/[0.1] hover:border-blue-500/50 hover:bg-blue-500/10 text-slate-300 hover:text-blue-400"
        >
          تحميل قالب إكسيل
        </Button>

        {/* Excel/CSV Import Button */}
        <Button
          variant="outline"
          size="sm"
          icon={<FileSpreadsheet size={14} />}
          onClick={triggerImport}
          className="border-white/[0.1] hover:border-emerald-500/50 hover:bg-emerald-500/10 text-slate-300 hover:text-emerald-400"
        >
          استيراد (Excel/CSV)
        </Button>

        {/* Stats */}
        <span className="text-xs text-slate-500 shrink-0">
          {filtered.length} بطاقة
        </span>
      </div>

      {/* ── Bulk action bar (conditional) ── */}
      {anySelected && (
        <div className="px-4 py-2 border-b border-purple-500/20 bg-purple-500/10 flex items-center gap-3 animate-slide-up">
          <button
            onClick={toggleAll}
            className="text-slate-400 hover:text-white transition-colors"
          >
            {allSelected ? (
              <CheckSquare size={14} className="text-purple-400" />
            ) : (
              <Square size={14} />
            )}
          </button>
          <span className="text-xs font-medium text-purple-300">
            تم تحديد {selected.size} بطاقة
          </span>
          <div className="flex items-center gap-2 mr-auto">
            <Button variant="success" size="xs" icon={<Archive size={11} />}>
              تصدير ZIP ({selected.size})
            </Button>
            <Button variant="outline" size="xs" icon={<Download size={11} />}>
              تصدير PNG
            </Button>
            <Button
              variant="danger"
              size="xs"
              icon={<Trash2 size={16} />}
              onClick={handleBulkDelete}
              disabled={!anySelected}
            >
              Delete Selected
            </Button>
          </div>
        </div>
      )}

      {/* ── Cards area ── */}
      <div className="flex-1 overflow-y-auto p-4 scroll-rtl">
        {filtered.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-3 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center">
              <Search size={24} className="text-slate-600" />
            </div>
            <p className="text-sm text-slate-500">لا توجد بطاقات تطابق البحث</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {filtered.map((card: CardFrameData & { id: string }) => (
              <CardThumbnail
                key={card.id}
                card={card}
                selected={selected.has(card.id)}
                onSelect={toggleSelect}
                onOpen={openCard}
                onRemove={handleRemoveCard}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2 max-w-4xl mx-auto">
            {filtered.map((card: CardFrameData & { id: string }) => (
              <CardListRow
                key={card.id}
                card={card}
                selected={selected.has(card.id)}
                onSelect={toggleSelect}
                onOpen={openCard}
                onRemove={handleRemoveCard}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
});
CollectionPage.displayName = 'CollectionPage';

