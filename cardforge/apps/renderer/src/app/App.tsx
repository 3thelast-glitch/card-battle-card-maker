import { Suspense, lazy, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../state/appStore';
import { loadBuiltInTemplates } from '../templates/loadTemplates';
import { HomeScreen } from '../features/home/HomeScreen';
import { DashboardScreen } from '../features/project/DashboardScreen';
import { EditorScreen } from '../features/editor/EditorScreen';
import { DataTableScreen } from '../features/data/DataTableScreen';
import { ExportScreen } from '../features/export/ExportScreen';
import { TemplateGalleryScreen } from '../features/templates/TemplateGalleryScreen';
import { SettingsScreen } from '../features/settings/SettingsScreen';
import { AssetsScreen } from '../features/assets/AssetsScreen';
import { Button, Row } from '../components/ui';
import { createProjectFromBlueprint, createEmptyProject } from '../../../../packages/core/src/index';
import { addRecentProject, loadRecentProjects, parseProject, stringifyProject } from '../../../../packages/storage/src/index';
import type { TemplateDefinition } from '../templates/types';
import { templateToBlueprint } from '../templates/types';

const SimulatorScreen = lazy(() => import('../screens/SimulatorScreen'));

export function App() {
  const { t, i18n } = useTranslation();
  const {
    screen,
    setScreen,
    project,
    setProject,
    templates,
    setTemplates,
    recents,
    setRecents,
    setActiveBlueprintId,
    setActiveSetId,
    setActiveTableId,
  } = useAppStore();

  useEffect(() => {
    setTemplates(loadBuiltInTemplates());
  }, [setTemplates]);

  useEffect(() => {
    setRecents(loadRecentProjects());
  }, [setRecents]);

  const openProject = async (filePath?: string) => {
    if (!window.cardsmith) return;

    let pickedPath = filePath;
    if (!pickedPath) {
      const res = await window.cardsmith.openFile();
      if (res.canceled || !res.filePaths?.[0]) return;
      pickedPath = res.filePaths[0];
    }

    const res = await window.cardsmith.readFile(pickedPath);
    if (!res.ok || !res.text) return;
    let loaded;
    try {
      loaded = parseProject(res.text);
    } catch (err) {
      alert(t('app.errors.parseProject'));
      return;
    }
    loaded.meta.filePath = pickedPath;
    setProject(loaded);
    setActiveBlueprintId(loaded.blueprints[0]?.id);
    setActiveSetId(loaded.sets[0]?.id);
    setActiveTableId(loaded.dataTables[0]?.id);
    setScreen('dashboard');

    const next = addRecentProject(loaded, pickedPath);
    setRecents(next);
  };

  const saveProject = async () => {
    if (!window.cardsmith || !project) return;
    let filePath = project.meta.filePath;
    if (!filePath) {
      const res = await window.cardsmith.saveFile();
      if (res.canceled || !res.filePath) return;
      filePath = res.filePath;
    }
    const text = stringifyProject({ ...project, meta: { ...project.meta, filePath } });
    await window.cardsmith.writeFile(filePath, { text });
    setProject({ ...project, meta: { ...project.meta, filePath } });
    const next = addRecentProject(project, filePath);
    setRecents(next);
  };

  const createNewProject = (name: string, templateId?: string) => {
    const safeName = name?.trim() || t('project.untitled');
    const template = (templates.find((tpl) => tpl.id === templateId) ?? templates[0]) as TemplateDefinition | undefined;
    const blueprint = template ? templateToBlueprint(template, i18n.language) : undefined;
    const project = blueprint ? createProjectFromBlueprint(blueprint, safeName) : createEmptyProject(safeName);
    project.sets = project.sets.map((set, idx) =>
      idx === 0 ? { ...set, name: t('project.defaultSet') } : set,
    );
    setProject(project);
    setActiveBlueprintId(project.blueprints[0]?.id);
    setActiveSetId(project.sets[0]?.id);
    setActiveTableId(project.dataTables[0]?.id);
    setScreen('dashboard');
  };

  return (
    <div className="app">
      <div className="topbar">
        <Row gap={14}>
          <div>
            <div className="topbar-title">{t('app.title')}</div>
            <div className="topbar-subtitle">{t('app.subtitle')}</div>
          </div>
          {project ? (
            <div className="topbar-subtitle">
              {t('app.project')}: <strong>{project.meta.name}</strong>
            </div>
          ) : null}
        </Row>
        <Row gap={8}>
          <Button variant={screen === 'home' ? 'primary' : 'ghost'} size="sm" onClick={() => setScreen('home')}>
            {t('app.nav.home')}
          </Button>
          <Button variant={screen === 'templates' ? 'primary' : 'ghost'} size="sm" onClick={() => setScreen('templates')}>
            {t('app.nav.templates')}
          </Button>
          {project ? (
            <>
              <Button variant={screen === 'dashboard' ? 'primary' : 'ghost'} size="sm" onClick={() => setScreen('dashboard')}>
                {t('app.nav.dashboard')}
              </Button>
              <Button variant={screen === 'editor' ? 'primary' : 'ghost'} size="sm" onClick={() => setScreen('editor')}>
                {t('app.nav.blueprint')}
              </Button>
              <Button variant={screen === 'data' ? 'primary' : 'ghost'} size="sm" onClick={() => setScreen('data')}>
                {t('app.nav.data')}
              </Button>
              <Button variant={screen === 'assets' ? 'primary' : 'ghost'} size="sm" onClick={() => setScreen('assets')}>
                {t('app.nav.assets')}
              </Button>
              <Button variant={screen === 'export' ? 'primary' : 'ghost'} size="sm" onClick={() => setScreen('export')}>
                {t('app.nav.export')}
              </Button>
              <Button variant={screen === 'simulator' ? 'primary' : 'ghost'} size="sm" onClick={() => setScreen('simulator')}>
                {t('app.nav.simulator')}
              </Button>
              <Button variant="outline" size="sm" onClick={saveProject} title={t('app.saveTooltip')}>
                {t('app.nav.save')}
              </Button>
            </>
          ) : null}
          <Button variant={screen === 'settings' ? 'primary' : 'ghost'} size="sm" onClick={() => setScreen('settings')}>
            {t('app.nav.settings')}
          </Button>
        </Row>
      </div>

      {screen === 'home' ? (
        <HomeScreen
          templates={templates}
          recents={recents}
          onCreate={createNewProject}
          onOpen={openProject}
          onBrowseTemplates={() => setScreen('templates')}
        />
      ) : null}
      {screen === 'templates' ? (
        <TemplateGalleryScreen templates={templates} onCreate={createNewProject} />
      ) : null}
      {screen === 'settings' ? <SettingsScreen /> : null}
      {screen === 'dashboard' && project ? (
        <DashboardScreen
          project={project}
          onChange={setProject}
          onOpenBlueprint={(id) => { setActiveBlueprintId(id); setScreen('editor'); }}
          onOpenData={() => setScreen('data')}
          onOpenExport={() => setScreen('export')}
        />
      ) : null}
      {screen === 'editor' && project ? <EditorScreen project={project} onChange={setProject} /> : null}
      {screen === 'data' && project ? <DataTableScreen project={project} onChange={setProject} /> : null}
      {screen === 'assets' && project ? <AssetsScreen project={project} onChange={setProject} /> : null}
      {screen === 'export' && project ? <ExportScreen project={project} onChange={setProject} /> : null}
      {screen === 'simulator' && project ? (
        <Suspense fallback={<div className="uiHelp">Loading Simulator...</div>}>
          <SimulatorScreen project={project} />
        </Suspense>
      ) : null}
    </div>
  );
}
