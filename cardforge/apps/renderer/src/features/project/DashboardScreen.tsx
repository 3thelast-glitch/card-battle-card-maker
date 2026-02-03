import React from 'react';
import type { Blueprint, Project } from '@cardsmith/core';
import { createId } from '@cardsmith/core';
import { Badge, Button, Panel, Row } from '../../components/ui';

export function DashboardScreen(props: {
  project: Project;
  onChange: (project: Project) => void;
  onOpenBlueprint: (id: string) => void;
  onOpenData: () => void;
  onOpenExport: () => void;
}) {
  const { project } = props;

  const createBlankBlueprint = () => {
    const blueprint: Blueprint = {
      id: createId('bp'),
      name: `Blueprint ${project.blueprints.length + 1}`,
      description: 'Blank blueprint',
      category: 'Blank',
      size: { w: 750, h: 1050 },
      background: '#101a2f',
      elements: [],
    };
    const next = {
      ...project,
      blueprints: [...project.blueprints, blueprint],
    };
    props.onChange(next);
    props.onOpenBlueprint(blueprint.id);
  };

  return (
    <div className="screen" style={{ padding: 16 }}>
      <div style={{ display: 'grid', gap: 14, gridTemplateColumns: '1fr 1fr' }}>
        <Panel title="Component Manager" subtitle="Sets, blueprints, and item counts at a glance.">
          <div className="list">
            <Row gap={12}>
              <Badge>Sets: {project.sets.length}</Badge>
              <Badge>Blueprints: {project.blueprints.length}</Badge>
              <Badge>Items: {project.items.length}</Badge>
            </Row>
            <div className="divider" />
            <div className="list">
              {project.sets.map((set) => (
                <div key={set.id} className="list-item">
                  <div>
                    <div style={{ fontWeight: 600 }}>{set.name}</div>
                    <div className="hint">Set ID: {set.id}</div>
                  </div>
                  <Badge>{project.items.filter((item) => item.setId === set.id).length} items</Badge>
                </div>
              ))}
            </div>
            <Row gap={10}>
              <Button onClick={props.onOpenData}>Import Data</Button>
              <Button variant="outline" onClick={props.onOpenExport}>
                Export
              </Button>
            </Row>
          </div>
        </Panel>

        <Panel title="Blueprints" subtitle="Pick a blueprint to edit or create a new one.">
          <div className="list">
            {project.blueprints.length === 0 ? (
              <div className="empty">No blueprints yet. Create one to get started.</div>
            ) : (
              project.blueprints.map((bp) => (
                <div key={bp.id} className="list-item">
                  <div>
                    <div style={{ fontWeight: 600 }}>{bp.name}</div>
                    <div className="hint">{bp.description ?? 'Blueprint template'}</div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => props.onOpenBlueprint(bp.id)}>
                    Open
                  </Button>
                </div>
              ))
            )}
            <Button variant="primary" onClick={createBlankBlueprint}>
              Create Blueprint
            </Button>
          </div>
        </Panel>
      </div>
    </div>
  );
}
