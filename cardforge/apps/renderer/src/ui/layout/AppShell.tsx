import type { ReactNode } from 'react';

type Props = {
  header: ReactNode;
  left: ReactNode;
  center: ReactNode;
  right: ReactNode;
  leftClassName?: string;
  rightClassName?: string;
};

export function AppShell({ header, left, center, right, leftClassName, rightClassName }: Props) {
  return (
    <div className="appShell">
      <header className="topBar">{header}</header>
      <div className="workspace">
        <aside className={`panel uiPanel leftPanel ${leftClassName ?? ''}`}>{left}</aside>
        <main className="panel uiPanel centerPanel">{center}</main>
        <aside className={`panel uiPanel rightPanel ${rightClassName ?? ''}`}>{right}</aside>
      </div>
    </div>
  );
}
