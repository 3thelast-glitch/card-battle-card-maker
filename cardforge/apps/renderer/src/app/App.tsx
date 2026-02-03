import React, { useEffect } from 'react';
import { useAppStore } from '../state/appStore';
import { loadBuiltInTemplates } from '../templates/loadTemplates';
import { HomeScreen } from '../features/home/HomeScreen';
import { DashboardScreen } from '../features/project/DashboardScreen';
import { EditorScreen } from '../features/editor/EditorScreen';
import { DataTableScreen } from '../features/data/DataTableScreen';
import { ExportScreen } from '../features/export/ExportScreen';
import { Button, Row } from '../components/ui';
import { createProjectFromBlueprint, createEmptyProject } from '@cardsmith/core';
import { addRecentProject, loadRecentProjects, parseProject, stringifyProject } from '@cardsmith/storage';

export function App() {
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
      alert('Failed to parse project file.');
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
    if (!templates.length) return;
    const template = templates.find((t) => t.id === templateId) ?? templates[0];
    const project = template ? createProjectFromBlueprint(template, name) : createEmptyProject(name);
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
            <div className="topbar-title">CardSmith Studio</div>
            <div className="topbar-subtitle">Windows-first tabletop component designer</div>
          </div>
          {project ? (
            <div className="topbar-subtitle">
              Project: <strong>{project.meta.name}</strong>
            </div>
          ) : null}
        </Row>
        <Row gap={8}>
          {project ? (
            <>
              <Button variant={screen === 'dashboard' ? 'primary' : 'ghost'} size="sm" onClick={() => setScreen('dashboard')}>
                Dashboard
              </Button>
              <Button variant={screen === 'editor' ? 'primary' : 'ghost'} size="sm" onClick={() => setScreen('editor')}>
                Blueprint
              </Button>
              <Button variant={screen === 'data' ? 'primary' : 'ghost'} size="sm" onClick={() => setScreen('data')}>
                Data
              </Button>
              <Button variant={screen === 'export' ? 'primary' : 'ghost'} size="sm" onClick={() => setScreen('export')}>
                Export
              </Button>
              <Button variant="outline" size="sm" onClick={saveProject} title="Ctrl+S">
                Save
              </Button>
            </>
          ) : null}
        </Row>
      </div>

      {screen === 'home' ? (
        <HomeScreen
          templates={templates}
          recents={recents}
          onCreate={createNewProject}
          onOpen={openProject}
        />
      ) : null}
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
      {screen === 'export' && project ? <ExportScreen project={project} onChange={setProject} /> : null}
    </div>
  );
}
