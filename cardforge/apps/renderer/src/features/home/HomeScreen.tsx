import React, { useEffect, useMemo, useState } from 'react';
import type { Blueprint } from '@cardsmith/core';
import type { RecentProject } from '@cardsmith/storage';
import { Badge, Button, Panel, Row } from '../../components/ui';

export function HomeScreen(props: {
  templates: Blueprint[];
  recents: RecentProject[];
  onCreate: (name: string, templateId?: string) => void;
  onOpen: (filePath?: string) => void;
}) {
  const [name, setName] = useState('Untitled Project');
  const [templateId, setTemplateId] = useState<string | undefined>(props.templates[0]?.id);

  const templateOptions = useMemo(() => props.templates, [props.templates]);

  useEffect(() => {
    if (!templateId && props.templates[0]) {
      setTemplateId(props.templates[0].id);
    }
  }, [props.templates, templateId]);

  return (
    <div className="screen" style={{ padding: 24 }}>
      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1.2fr 1fr' }}>
        <Panel title="Start a New Project" subtitle="Pick a blueprint and create your first set.">
          <div className="list">
            <div>
              <div className="hint">Project Name</div>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <div className="hint">Blueprint Templates</div>
              <div className="grid-2" style={{ marginTop: 8 }}>
                {templateOptions.map((tpl) => {
                  const selected = tpl.id === templateId;
                  return (
                    <button
                      key={tpl.id}
                      className="list-item"
                      style={{
                        borderColor: selected ? 'rgba(56,189,248,0.6)' : undefined,
                        background: selected ? 'rgba(56,189,248,0.08)' : undefined,
                        textAlign: 'left',
                      }}
                      onClick={() => setTemplateId(tpl.id)}
                    >
                      <div>
                        <div style={{ fontWeight: 600 }}>{tpl.name}</div>
                        <div className="hint">{tpl.description ?? 'Template'}</div>
                      </div>
                      <Badge>{tpl.category ?? 'General'}</Badge>
                    </button>
                  );
                })}
              </div>
            </div>
            <Row gap={10}>
              <Button onClick={() => props.onCreate(name, templateId)}>Create Project</Button>
              <Button variant="outline" onClick={() => props.onOpen()}>
                Open Project
              </Button>
            </Row>
          </div>
        </Panel>

        <Panel title="Recent Projects" subtitle="Pick up where you left off.">
          <div className="list">
            {props.recents.length === 0 ? (
              <div className="empty">No recent projects yet. Create a project to get started.</div>
            ) : (
              props.recents.map((recent) => (
                <div key={recent.filePath} className="list-item">
                  <div>
                    <div style={{ fontWeight: 600 }}>{recent.name}</div>
                    <div className="hint">{recent.filePath}</div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => props.onOpen(recent.filePath)}>
                    Open
                  </Button>
                </div>
              ))
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}
