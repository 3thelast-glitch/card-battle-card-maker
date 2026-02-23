// src/ui/layout/components/ui/Button.tsx
import { memo, type ButtonHTMLAttributes, type ReactNode } from 'react';

type Variant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'outline'
  | 'danger'
  | 'success';
type Size = 'xs' | 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  iconRight?: ReactNode;
  loading?: boolean;
  children?: ReactNode;
  fullWidth?: boolean;
}

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:from-purple-500 hover:to-blue-500 border border-purple-500/30',
  secondary:
    'bg-slate-800/70 text-slate-200 border border-slate-700/60 hover:bg-slate-700/80 hover:border-slate-600/70',
  ghost:
    'bg-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] border border-transparent',
  outline:
    'bg-transparent text-slate-300 border border-slate-600/60 hover:bg-white/[0.06] hover:border-slate-500/80',
  danger:
    'bg-red-500/15 text-red-300 border border-red-500/40 hover:bg-red-500/25 hover:border-red-400/60',
  success:
    'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/25 hover:border-emerald-400/60',
};

const SIZES: Record<Size, string> = {
  xs: 'px-2.5 py-1 text-xs gap-1.5 rounded-lg',
  sm: 'px-3 py-1.5 text-xs gap-1.5 rounded-xl',
  md: 'px-4 py-2 text-sm gap-2 rounded-xl',
  lg: 'px-5 py-2.5 text-sm gap-2 rounded-2xl',
};

export const Button = memo<ButtonProps>(
  ({
    variant = 'secondary',
    size = 'md',
    icon,
    iconRight,
    loading = false,
    children,
    fullWidth = false,
    className = '',
    disabled,
    ...rest
  }) => {
    const base =
      'inline-flex items-center justify-center font-semibold transition-all duration-200 select-none shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/60 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95';

    return (
      <button
        className={`${base} ${VARIANTS[variant]} ${SIZES[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
        disabled={disabled || loading}
        {...rest}
      >
        {loading ? (
          <span className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
        ) : icon ? (
          <span className="shrink-0">{icon}</span>
        ) : null}
        {children && <span className="truncate">{children}</span>}
        {iconRight && !loading && <span className="shrink-0">{iconRight}</span>}
      </button>
    );
  },
);

Button.displayName = 'Button';
