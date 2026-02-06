import { useEffect, useRef } from 'react';

type Props = {
  open: boolean;
  title: string;
  description?: string;
  confirmText: string;
  cancelText: string;
  tone?: 'default' | 'danger';
  onConfirm: () => void;
  onClose: () => void;
};

export function Dialog({
  open,
  title,
  description,
  confirmText,
  cancelText,
  tone = 'default',
  onConfirm,
  onClose,
}: Props) {
  const confirmRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;
    setTimeout(() => confirmRef.current?.focus(), 0);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'Enter') onConfirm();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose, onConfirm]);

  if (!open) return null;

  return (
    <div className="dialogOverlay" role="dialog" aria-modal="true" onMouseDown={onClose}>
      <div className="dialogPanel" onMouseDown={(event) => event.stopPropagation()}>
        <div className="dialogHeader">
          <div className="uiTitle">{title}</div>
          {description ? <div className="uiSub">{description}</div> : null}
        </div>

        <div className="uiDivider" />

        <div className="uiRow" style={{ justifyContent: 'flex-end' }}>
          <button className="uiBtn" type="button" onClick={onClose}>
            {cancelText}
          </button>
          <button
            ref={confirmRef}
            className={tone === 'danger' ? 'uiBtn uiBtnDanger' : 'uiBtn uiBtnPrimary'}
            type="button"
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
