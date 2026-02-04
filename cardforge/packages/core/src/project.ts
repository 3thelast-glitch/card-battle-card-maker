import type { Blueprint, Project, SetModel } from './model';
import { createId, deepClone } from './utils';

const PROJECT_VERSION = '1.0.0';

export function createEmptyProject(name = 'Untitled Project'): Project {
  const now = new Date().toISOString();
  const defaultSet: SetModel = {
    id: createId('set'),
    name: 'Base Set',
  };

  return {
    meta: {
      name,
      createdAt: now,
      updatedAt: now,
      version: PROJECT_VERSION,
    },
    sets: [defaultSet],
    blueprints: [],
    items: [],
    dataTables: [],
    assets: {
      images: [],
    },
  };
}

export function createProjectFromBlueprint(template: Blueprint, name = 'Untitled Project'): Project {
  const project = createEmptyProject(name);
  project.blueprints = [cloneBlueprint(template)];
  return project;
}

export function cloneBlueprint(blueprint: Blueprint): Blueprint {
  return {
    ...blueprint,
    id: createId('bp'),
    elements: blueprint.elements.map((el) => ({ ...deepClone(el) })),
  };
}

export function touchProject(project: Project): Project {
  return {
    ...project,
    meta: {
      ...project.meta,
      updatedAt: new Date().toISOString(),
      version: PROJECT_VERSION,
    },
  };
}

export function getProjectVersion() {
  return PROJECT_VERSION;
}
