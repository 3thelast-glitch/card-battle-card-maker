// ── CardForge Studio — Professional Redesign Entry Point ──────────────────
// Renders the new three-tab AppShell (Design / Generate / Collection).
// The original multi-screen project management code has been replaced by this
// new clean shell. Project IPC / save / open can be re-integrated incrementally
// into AppShell.tsx as needed.
// ────────────────────────────────────────────────────────────────────────────
import { useEffect } from 'react';
import { AppShell } from '../ui/layout/AppShell';
import { useAppStore } from '../state/appStore';
import { loadBuiltInTemplates } from '../templates/loadTemplates';
import { loadRecentProjects } from '../../../../packages/storage/src/index';

export function App() {
  const { setTemplates, setRecents } = useAppStore();

  // Seed built-in templates + recents on startup
  useEffect(() => {
    setTemplates(loadBuiltInTemplates());
  }, [setTemplates]);

  useEffect(() => {
    setRecents(loadRecentProjects());
  }, [setRecents]);

  return <AppShell />;
}
