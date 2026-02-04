import React from 'react';
import type { Blueprint, Project } from '@cardsmith/core';
import { createId } from '@cardsmith/core';
import { Badge, Button, Panel, Row } from '../../components/ui';
import { useTranslation } from 'react-i18next';

export function DashboardScreen(props: {
  project: Project;
  onChange: (project: Project) => void;
  onOpenBlueprint: (id: string) => void;
  onOpenData: () => void;
  onOpenExport: () => void;
}) {
  const { t } = useTranslation();
  const { project } = props;

  const createBlankBlueprint = () => {
    const blueprint: Blueprint = {
      id: createId('bp'),
      name: t('dashboard.newBlueprintName', { index: project.blueprints.length + 1 }),
      description: t('dashboard.blankBlueprint'),
      category: t('dashboard.blankCategory'),
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
        <Panel title={t('dashboard.managerTitle')} subtitle={t('dashboard.managerSubtitle')}>
          <div className="list">
            <Row gap={12}>
              <Badge>{t('dashboard.setsCount', { count: project.sets.length })}</Badge>
              <Badge>{t('dashboard.blueprintsCount', { count: project.blueprints.length })}</Badge>
              <Badge>{t('dashboard.itemsCount', { count: project.items.length })}</Badge>
            </Row>
            <div className="divider" />
            <div className="list">
              {project.sets.map((set) => (
                <div key={set.id} className="list-item">
                  <div>
                    <div style={{ fontWeight: 600 }}>{set.name}</div>
                    <div className="hint">{t('dashboard.setId', { id: set.id })}</div>
                  </div>
                  <Badge>{t('dashboard.itemsInSet', { count: project.items.filter((item) => item.setId === set.id).length })}</Badge>
                </div>
              ))}
            </div>
            <Row gap={10}>
              <Button onClick={props.onOpenData}>{t('dashboard.importData')}</Button>
              <Button variant="outline" onClick={props.onOpenExport}>
                {t('dashboard.export')}
              </Button>
            </Row>
          </div>
        </Panel>

        <Panel title={t('dashboard.blueprintsTitle')} subtitle={t('dashboard.blueprintsSubtitle')}>
          <div className="list">
            {project.blueprints.length === 0 ? (
              <div className="empty">{t('dashboard.noBlueprints')}</div>
            ) : (
              project.blueprints.map((bp) => (
                <div key={bp.id} className="list-item">
                  <div>
                    <div style={{ fontWeight: 600 }}>{bp.name}</div>
                    <div className="hint">{bp.description ?? t('dashboard.blueprintFallback')}</div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => props.onOpenBlueprint(bp.id)}>
                    {t('dashboard.openBlueprint')}
                  </Button>
                </div>
              ))
            )}
            <Button variant="primary" onClick={createBlankBlueprint}>{t('dashboard.createBlueprint')}</Button>
          </div>
        </Panel>
      </div>
    </div>
  );
}
