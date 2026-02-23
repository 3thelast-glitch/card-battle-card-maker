import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastData {
  id: number;
  message: string;
  type: ToastType;
}

const ICONS = {
  success: (
    <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
  ),
  error: <XCircle size={16} className="text-rose-400    flex-shrink-0" />,
  info: <Info size={16} className="text-blue-400    flex-shrink-0" />,
};

const ACCENT = {
  success: 'border-l-emerald-500',
  error: 'border-l-rose-500',
  info: 'border-l-blue-500',
};

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastData;
  onDismiss: () => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Mount → slide in
    const show = requestAnimationFrame(() => setVisible(true));
    // Auto-dismiss sequence
    const out = setTimeout(() => setVisible(false), 3000);
    const remove = setTimeout(onDismiss, 3350);
    return () => {
      cancelAnimationFrame(show);
      clearTimeout(out);
      clearTimeout(remove);
    };
  }, [onDismiss]);

  return (
    <div
      className={[
        'flex items-center gap-3 pl-3 pr-2 py-3 rounded-xl',
        'bg-[#1A2030] border border-[#2D3A5A] border-l-4',
        'shadow-2xl shadow-black/50 text-sm text-slate-200',
        ACCENT[toast.type],
        'transition-all duration-300 ease-out',
        visible ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0',
      ].join(' ')}
      style={{ minWidth: 260, maxWidth: 360 }}
    >
      {ICONS[toast.type]}
      <span className="flex-1 leading-snug">{toast.message}</span>
      <button
        type="button"
        onClick={() => {
          setVisible(false);
          setTimeout(onDismiss, 300);
        }}
        className="w-5 h-5 flex items-center justify-center rounded-md text-slate-500 hover:text-slate-300 hover:bg-white/[0.08] transition-colors flex-shrink-0"
      >
        <X size={12} />
      </button>
    </div>
  );
}

/** Mount this once anywhere in the tree — e.g. inside DataTableScreen — and pass toasts array */
export function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastData[];
  onDismiss: (id: number) => void;
}) {
  if (!toasts.length) return null;
  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onDismiss={() => onDismiss(toast.id)} />
        </div>
      ))}
    </div>
  );
}
