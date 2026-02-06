import React from 'react';

export function Panel(props: { title?: string; subtitle?: string; children: React.ReactNode; footer?: React.ReactNode; className?: string }) {
  return (
    <div className={`panel uiPanel ${props.className ?? ''}`}>
      {props.title ? (
        <div className="panel-header uiPanelHeader">
          <div>
            <div className="panel-title uiTitle">{props.title}</div>
            {props.subtitle ? <div className="panel-subtitle uiSub">{props.subtitle}</div> : null}
          </div>
        </div>
      ) : null}
      <div className="panel-body uiPanelBody">{props.children}</div>
      {props.footer ? <div className="panel-footer uiPanelBody">{props.footer}</div> : null}
    </div>
  );
}

export function Button(
  props: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'primary' | 'ghost' | 'outline' | 'danger';
    size?: 'sm' | 'md';
  },
) {
  const variant = props.variant ?? 'primary';
  const size = props.size ?? 'md';
  const variantClass =
    variant === 'primary'
      ? 'uiBtnPrimary'
      : variant === 'danger'
        ? 'uiBtnDanger'
        : variant === 'outline'
          ? 'uiBtnOutline'
          : variant === 'ghost'
            ? 'uiBtnGhost'
            : '';
  const sizeClass = size === 'sm' ? 'uiBtnSm' : '';
  return (
    <button
      {...props}
      className={`btn btn-${variant} btn-${size} uiBtn ${variantClass} ${sizeClass} ${props.className ?? ''}`}
    >
      {props.children}
    </button>
  );
}

export function IconButton(
  props: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'ghost' | 'outline' | 'danger' },
) {
  const variant = props.variant ?? 'ghost';
  return (
    <button {...props} className={`icon-btn icon-${variant} ${props.className ?? ''}`}>
      {props.children}
    </button>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`input uiInput ${props.className ?? ''}`} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`input uiInput ${props.className ?? ''}`} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`input uiSelect ${props.className ?? ''}`} />;
}

export function Toggle(props: { checked: boolean; onChange: (next: boolean) => void; label?: string }) {
  return (
    <label className="toggle">
      <input
        type="checkbox"
        checked={props.checked}
        onChange={(e) => props.onChange(e.target.checked)}
      />
      <span className="toggle-track" />
      {props.label ? <span className="toggle-label">{props.label}</span> : null}
    </label>
  );
}

export function Badge({ children, variant }: { children: React.ReactNode; variant?: 'good' | 'warn' }) {
  const variantClass = variant === 'good' ? 'uiBadgeGood' : variant === 'warn' ? 'uiBadgeWarn' : '';
  return <span className={`badge uiBadge ${variantClass}`}>{children}</span>;
}

export function Row({ children, gap = 10, align = 'center' }: { children: React.ReactNode; gap?: number; align?: 'center' | 'start' | 'end' }) {
  return (
    <div className="row uiRow" style={{ gap, alignItems: align === 'start' ? 'flex-start' : align === 'end' ? 'flex-end' : 'center' }}>
      {children}
    </div>
  );
}

export function Divider() {
  return <div className="divider uiDivider" />;
}

export function Kbd({ children }: { children: React.ReactNode }) {
  return <span className="kbd uiKbd">{children}</span>;
}
