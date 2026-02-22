// src/ui/layout/AppShell.tsx
// Phase 8 – fully wired to appStore:
//   • project open/save via Electron IPC (window.cardsmith)
//   • recents seeded from storage
//   • isDirty save indicator
//   • "Classic Tools" escape hatch → legacy screens modal (editor, export, data, etc.)
import { useState, useCallback } from 'react';
import {
  Palette, Zap, Layers, Save, Sun, Moon,
  FolderOpen, Wrench, Database, Download, Cpu,
  X, CheckCircle,
} from 'lucide-react';
import { DesignEditor } from './pages/design/DesignEditor';
import { GeneratorPage } from './pages/generate/GeneratorPage';
import { CollectionPage } from './pages/collection/CollectionPage';
import { useAppStore } from '../../state/appStore';
import { useCardEditorStore } from '../../store/cardEditorStore';
import { addRecentProject, loadRecentProjects, stringifyProject, parseProject } from '../../../../../packages/storage/src/index';

// ── Lazy-load legacy screens (keeps bundle fast) ────────────
import { lazy, Suspense } from 'react';
const EditorScreen = lazy(() => import('../../features/editor/EditorScreen').then(m => ({ default: m.EditorScreen })));
const ExportScreen = lazy(() => import('../../features/export/ExportScreen').then(m => ({ default: m.ExportScreen })));
const DataTableScreen = lazy(() => import('../../features/data/DataTableScreen').then(m => ({ default: m.DataTableScreen })));
const AssetsScreen = lazy(() => import('../../features/assets/AssetsScreen').then(m => ({ default: m.AssetsScreen })));

type Page = 'design' | 'generate' | 'collection';
type Legacy = 'editor' | 'export' | 'data' | 'assets' | null;

// ── Helpers ─────────────────────────────────────────────────
const ipc = () => (window as any).cardsmith as Record<string, any> | undefined;

// ══ AppShell ════════════════════════════════════════════════
export const AppShell = () => {
  const [activePage, setActivePage] = useState<Page>('design');
  const [isDark, setIsDark] = useState(true);
  const [legacy, setLegacy] = useState<Legacy>(null);
  const [saving, setSaving] = useState(false);
  const [saveOk, setSaveOk] = useState(false);

  // ── Global state ──
  const {
    project, setProject, setRecents,
    updateProject,
  } = useAppStore();

  const isDirty = useCardEditorStore(s => s.isDirty);
  const markClean = useCardEditorStore(s => s.markClean);

  // ── Open project ──
  const handleOpen = useCallback(async () => {
    const api = ipc();
    if (!api?.openFile) return;
    const res = await api.openFile();
    if (res.canceled || !res.text || !res.filePath) return;
    try {
      const proj = parseProject(res.text);
      const projWithPath = { ...proj, meta: { ...proj.meta, filePath: res.filePath } };
      setProject(projWithPath);
      const next = addRecentProject(projWithPath, res.filePath);
      setRecents(next);
      loadRecentProjects();
    } catch {
      alert('تعذّر فتح الملف — تأكد من أنه ملف .cardsmith.json صالح');
    }
  }, [setProject, setRecents]);

  // ── Save project ──
  const handleSave = useCallback(async () => {
    if (!project) return;
    const api = ipc();
    if (!api?.writeFile) return;
    setSaving(true);
    try {
      let filePath: string | undefined = project.meta.filePath;
      if (!filePath) {
        const res = await api.saveFile();
        if (res.canceled || !res.filePath) return;
        filePath = res.filePath as string;
      }
      const savedProject = { ...project, meta: { ...project.meta, filePath: filePath! } };
      const text = stringifyProject(savedProject);
      await api.writeFile(filePath!, { text });
      const next = addRecentProject(savedProject, filePath!);
      setRecents(next);
      markClean();
      setSaveOk(true);
      setTimeout(() => setSaveOk(false), 2000);
    } finally {
      setSaving(false);
    }
  }, [project, setRecents, markClean]);

  // ── Nav items ──
  const NAV_ITEMS = [
    { id: 'design' as Page, icon: Palette, label: 'التصميم', badge: '' },
    { id: 'generate' as Page, icon: Zap, label: 'التوليد', badge: 'AI' },
    { id: 'collection' as Page, icon: Layers, label: 'المجموعة', badge: '' },
  ];

  // ── Legacy tool items ──
  const LEGACY_TOOLS = [
    { id: 'editor' as Legacy, icon: Cpu, label: 'محرر Konva', hint: 'تحرير عناصر البطاقة' },
    { id: 'data' as Legacy, icon: Database, label: 'جداول البيانات', hint: 'استيراد CSV / Excel' },
    { id: 'export' as Legacy, icon: Download, label: 'التصدير', hint: 'PNG / ZIP / JSON' },
    { id: 'assets' as Legacy, icon: Layers, label: 'الأصول', hint: 'إدارة صور الأصول' },
  ];

  return (
    <div
      dir="rtl"
      className={[
        'h-screen w-screen flex flex-col overflow-hidden',
        'font-cairo font-medium antialiased select-none',
        isDark
          ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100'
          : 'bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-900',
      ].join(' ')}
    >
      {/* ══════════════════════════════════════════════════════ */}
      {/* Header – 56px */}
      {/* ══════════════════════════════════════════════════════ */}
      <header className="h-14 flex-shrink-0 flex items-center px-4 z-50
        border-b border-slate-800/50 backdrop-blur-2xl bg-slate-950/95">
        <div className="w-full flex items-center justify-between gap-3">

          {/* Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600
              rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/25 ring-2 ring-purple-500/30">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block leading-none">
              <h1 className="text-lg font-black bg-gradient-to-r from-purple-400 via-indigo-400 to-blue-400
                bg-clip-text text-transparent tracking-tight">CardForge</h1>
              <p className="text-[9px] text-slate-400 font-medium tracking-widest uppercase mt-0.5">Studio Pro</p>
            </div>
          </div>

          {/* Main nav */}
          <nav className="flex items-center bg-slate-900/60 backdrop-blur-xl px-1 py-1
            rounded-3xl border border-slate-700/50 shadow-xl shadow-slate-900/50">
            {NAV_ITEMS.map(({ id, icon: Icon, label, badge }) => {
              const isActive = activePage === id;
              return (
                <button key={id} onClick={() => setActivePage(id)}
                  className={[
                    'group relative px-4 py-2 rounded-2xl text-sm font-bold',
                    'transition-all duration-300 flex items-center gap-2',
                    isActive
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-xl shadow-purple-500/40 scale-105'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60',
                  ].join(' ')}>
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                  {badge && (
                    <span className="absolute -top-2 -right-2 px-1.5 py-0.5 min-w-[20px]
                      bg-emerald-500/90 text-white text-[8px] font-black rounded-full
                      flex items-center justify-center ring-2 ring-slate-950 shadow-md">
                      {badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">

            {/* Open project */}
            <button onClick={handleOpen} title="فتح مشروع"
              className="p-2 rounded-xl bg-white/[0.05] border border-white/[0.08]
                text-slate-400 hover:text-slate-200 hover:bg-white/[0.09] transition-all">
              <FolderOpen className="w-4 h-4" />
            </button>

            {/* Save */}
            <button onClick={handleSave} disabled={saving || !project}
              title={project ? 'حفظ المشروع (Ctrl+S)' : 'لا يوجد مشروع مفتوح'}
              className={[
                'p-2 rounded-xl border transition-all duration-200',
                saveOk
                  ? 'bg-emerald-600/30 border-emerald-500/50 text-emerald-300'
                  : isDirty && project
                    ? 'bg-amber-600/20 border-amber-500/40 text-amber-300 hover:bg-amber-600/35 animate-pulse'
                    : 'bg-emerald-600/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-600/25',
                (saving || !project) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
              ].join(' ')}>
              {saveOk
                ? <CheckCircle className="w-4 h-4" />
                : <Save className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />}
            </button>

            {/* Classic Tools */}
            <button onClick={() => setLegacy('editor')} title="الأدوات الكلاسيكية"
              className="p-2 rounded-xl bg-white/[0.05] border border-white/[0.08]
                text-slate-400 hover:text-slate-200 hover:bg-purple-600/20 hover:border-purple-500/40
                transition-all duration-200">
              <Wrench className="w-4 h-4" />
            </button>

            {/* Theme toggle */}
            <button onClick={() => setIsDark(p => !p)}
              title={isDark ? 'الوضع الفاتح' : 'الوضع الداكن'}
              className="p-2 rounded-xl bg-slate-800/50 hover:bg-slate-700/60
                text-slate-400 hover:text-slate-200 transition-all">
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════ */}
      {/* Main content */}
      {/* ══════════════════════════════════════════════════════ */}
      <main className="flex-1 overflow-hidden min-h-0">
        {activePage === 'design' && <DesignEditor />}
        {activePage === 'generate' && <GeneratorPage />}
        {activePage === 'collection' && <CollectionPage />}
      </main>

      {/* ══════════════════════════════════════════════════════ */}
      {/* Legacy Screens Modal (Phase 8 – keep existing features accessible) */}
      {/* ══════════════════════════════════════════════════════ */}
      {legacy !== null && (
        <div className="fixed inset-0 z-[200] flex items-stretch bg-black/70 backdrop-blur-sm">
          {/* Sidebar */}
          <aside className="w-48 flex-shrink-0 bg-[#0b0f1a] border-r border-white/[0.07]
            flex flex-col py-4 gap-1 overflow-y-auto">
            <div className="px-4 pb-3 border-b border-white/[0.06] mb-1">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">الأدوات الكلاسيكية</p>
            </div>
            {LEGACY_TOOLS.map(({ id, icon: Icon, label, hint }) => (
              <button key={id ?? 'null'} onClick={() => setLegacy(id)}
                className={[
                  'flex items-center gap-3 px-4 py-3 text-xs font-semibold transition-all',
                  legacy === id
                    ? 'bg-purple-600/25 text-purple-300 border-r-2 border-purple-400 -mr-px'
                    : 'text-slate-400 hover:bg-white/[0.05] hover:text-slate-200',
                ].join(' ')}>
                <Icon size={14} />
                <div className="text-right">
                  <div>{label}</div>
                  <div className="text-[9px] text-slate-600 font-normal mt-0.5">{hint}</div>
                </div>
              </button>
            ))}
          </aside>

          {/* Screen content */}
          <div className="flex-1 min-w-0 flex flex-col bg-[#070a14] relative">
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.07] bg-black/20 shrink-0">
              <span className="text-sm font-bold text-slate-200">
                {LEGACY_TOOLS.find(t => t.id === legacy)?.label}
              </span>
              <button onClick={() => setLegacy(null)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.08] transition-all">
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-hidden">
              <Suspense fallback={
                <div className="h-full flex items-center justify-center gap-3">
                  <div className="w-6 h-6 rounded-full border-2 border-purple-500/40 border-t-purple-400 animate-spin" />
                  <span className="text-sm text-slate-500">جاري التحميل...</span>
                </div>
              }>
                {legacy === 'editor' && project && (
                  <EditorScreen project={project} onChange={(p) => { updateProject(() => p); }} />
                )}
                {legacy === 'editor' && !project && (
                  <div className="h-full flex items-center justify-center flex-col gap-3 text-center">
                    <FolderOpen size={32} className="text-slate-600" />
                    <p className="text-sm text-slate-500">افتح مشروعًا أولاً لتشغيل محرر Konva</p>
                    <button onClick={handleOpen}
                      className="px-4 py-2 rounded-xl bg-purple-600/30 border border-purple-500/50 text-purple-300 text-xs font-semibold hover:bg-purple-600/45 transition-all">
                      فتح مشروع
                    </button>
                  </div>
                )}
                {legacy === 'export' && project && (
                  <ExportScreen project={project} onChange={(p) => { updateProject(() => p); }} />
                )}
                {legacy === 'export' && !project && (
                  <div className="h-full flex items-center justify-center text-sm text-slate-500">افتح مشروعًا لتمكين التصدير</div>
                )}
                {legacy === 'data' && project && (
                  <DataTableScreen project={project} onChange={(p) => { updateProject(() => p); }} />
                )}
                {legacy === 'data' && !project && (
                  <div className="h-full flex items-center justify-center text-sm text-slate-500">افتح مشروعًا لإدارة البيانات</div>
                )}
                {legacy === 'assets' && project && (
                  <AssetsScreen project={project} onChange={(p) => { updateProject(() => p); }} />
                )}
                {legacy === 'assets' && !project && (
                  <div className="h-full flex items-center justify-center text-sm text-slate-500">افتح مشروعًا لإدارة الأصول</div>
                )}
              </Suspense>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
