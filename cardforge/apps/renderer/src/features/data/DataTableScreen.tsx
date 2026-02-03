import React, { useMemo, useState } from 'react';
import Papa from 'papaparse';
import type { Blueprint, DataRow, DataTable, Project } from '@cardsmith/core';
import { createId } from '@cardsmith/core';
import { Button, Panel, Row, Select } from '../../components/ui';
import { useAppStore } from '../../state/appStore';

export function DataTableScreen(props: { project: Project; onChange: (project: Project) => void }) {
  const { project, onChange } = props;
  const { activeBlueprintId, activeTableId, setPreviewRowId, setActiveTableId } = useAppStore();
  const [selectedRowId, setSelectedRowId] = useState<string | undefined>();

  const table = project.dataTables.find((t) => t.id === activeTableId) ?? project.dataTables[0];
  const blueprint: Blueprint | undefined =
    project.blueprints.find((bp) => bp.id === activeBlueprintId) ?? project.blueprints[0];

  const columns = useMemo(() => {
    if (!table) return [];
    if (table.columns?.length) return table.columns;
    const colSet = new Set<string>();
    table.rows.forEach((row) => Object.keys(row.data).forEach((k) => colSet.add(k)));
    return Array.from(colSet);
  }, [table]);

  const updateTable = (nextTable: DataTable) => {
    const nextProject = {
      ...project,
      dataTables: [nextTable],
      items: buildItemsFromTable(nextTable, project, blueprint),
    };
    onChange(nextProject);
    setActiveTableId(nextTable.id);
  };

  const importData = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,application/json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const text = await file.text();
      let rows: Record<string, any>[] = [];
      if (file.name.toLowerCase().endsWith('.csv')) {
        const parsed = Papa.parse<Record<string, any>>(text, { header: true, skipEmptyLines: true });
        rows = (parsed.data ?? []).filter(Boolean);
      } else {
        const parsed = JSON.parse(text);
        rows = Array.isArray(parsed) ? parsed : parsed.rows ?? [];
      }

      const dataRows: DataRow[] = rows.map((row) => {
        const quantity = row.quantity ?? row.qty ?? row.Quantity;
        const setName = row.set ?? row.Set ?? row.setName;
        const setId = findSetIdByName(project, String(setName ?? ''));
        return {
          id: createId('row'),
          data: row,
          quantity: Number(quantity) || 1,
          setId,
          blueprintId: blueprint?.id,
        };
      });

      const nextTable: DataTable = {
        id: createId('table'),
        name: 'Main Data',
        columns: collectColumns(rows),
        rows: dataRows,
      };
      updateTable(nextTable);
    };
    input.click();
  };

  const addRow = () => {
    const nextRow: DataRow = {
      id: createId('row'),
      data: {},
      quantity: 1,
      setId: project.sets[0]?.id,
      blueprintId: blueprint?.id,
    };
    const nextTable: DataTable = table
      ? { ...table, rows: [...table.rows, nextRow] }
      : { id: createId('table'), name: 'Main Data', columns: [], rows: [nextRow] };
    updateTable(nextTable);
  };

  const updateCell = (rowId: string, key: string, value: any) => {
    if (!table) return;
    const nextColumns = table.columns.includes(key) ? table.columns : [...table.columns, key];
    const nextTable = {
      ...table,
      columns: nextColumns,
      rows: table.rows.map((row) => (row.id === rowId ? { ...row, data: { ...row.data, [key]: value } } : row)),
    };
    updateTable(nextTable);
  };

  const updateQuantity = (rowId: string, value: number) => {
    if (!table) return;
    const nextTable = {
      ...table,
      rows: table.rows.map((row) => (row.id === rowId ? { ...row, quantity: value } : row)),
    };
    updateTable(nextTable);
  };

  const updateSet = (rowId: string, value: string) => {
    if (!table) return;
    const nextTable = {
      ...table,
      rows: table.rows.map((row) => (row.id === rowId ? { ...row, setId: value } : row)),
    };
    updateTable(nextTable);
  };

  const removeRow = (rowId: string) => {
    if (!table) return;
    const nextTable = { ...table, rows: table.rows.filter((row) => row.id !== rowId) };
    updateTable(nextTable);
  };

  const bindingElements = blueprint?.elements.filter((el) => el.type === 'text' || el.type === 'image') ?? [];

  const updateBinding = (elementId: string, column: string) => {
    if (!blueprint) return;
    const nextBlueprint = {
      ...blueprint,
      elements: blueprint.elements.map((el) => (el.id === elementId ? { ...el, bindingKey: column } : el)),
    };
    const nextProject = {
      ...project,
      blueprints: project.blueprints.map((bp) => (bp.id === blueprint.id ? nextBlueprint : bp)),
    };
    onChange(nextProject);
  };

  return (
    <div className="screen" style={{ padding: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 14, minHeight: 0 }}>
        <Panel title="Data Table" subtitle="Import, edit, and map data rows.">
          <div className="list">
            <Row gap={10}>
              <Button onClick={importData}>Import CSV/JSON</Button>
              <Button variant="outline" onClick={addRow}>Add Row</Button>
            </Row>
            {!table ? (
              <div className="empty">No data yet. Import a CSV or JSON file to get started.</div>
            ) : (
              <div style={{ overflow: 'auto', maxHeight: 520 }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Row</th>
                      {columns.map((col) => (
                        <th key={col}>{col}</th>
                      ))}
                      <th>Quantity</th>
                      <th>Set</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {table.rows.map((row, idx) => (
                      <tr key={row.id} style={{ background: row.id === selectedRowId ? 'rgba(56,189,248,0.08)' : undefined }}>
                        <td>{idx + 1}</td>
                        {columns.map((col) => (
                          <td key={col}>
                            <input
                              className="input"
                              value={row.data[col] ?? ''}
                              onChange={(e) => updateCell(row.id, col, e.target.value)}
                              onFocus={() => { setSelectedRowId(row.id); setPreviewRowId(row.id); }}
                            />
                          </td>
                        ))}
                        <td>
                          <input
                            className="input"
                            type="number"
                            min={1}
                            value={row.quantity ?? 1}
                            onChange={(e) => updateQuantity(row.id, Number(e.target.value))}
                          />
                        </td>
                        <td>
                          <select
                            className="input"
                            value={row.setId ?? project.sets[0]?.id}
                            onChange={(e) => updateSet(row.id, e.target.value)}
                          >
                            {project.sets.map((set) => (
                              <option key={set.id} value={set.id}>{set.name}</option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <Button size="sm" variant="danger" onClick={() => removeRow(row.id)}>Delete</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Panel>

        <Panel title="Bindings" subtitle="Map data columns to blueprint elements.">
          <div className="list">
            {bindingElements.length === 0 ? (
              <div className="empty">Add text or image elements to enable bindings.</div>
            ) : (
              bindingElements.map((el) => (
                <div key={el.id}>
                  <div className="hint">{el.name}</div>
                  <Select
                    value={el.bindingKey ?? ''}
                    onChange={(e) => updateBinding(el.id, e.target.value)}
                  >
                    <option value="">(No Binding)</option>
                    {columns.map((col) => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </Select>
                </div>
              ))
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function collectColumns(rows: Record<string, any>[]) {
  const colSet = new Set<string>();
  rows.forEach((row) => Object.keys(row).forEach((key) => colSet.add(key)));
  return Array.from(colSet);
}

function findSetIdByName(project: Project, name: string) {
  if (!name) return project.sets[0]?.id;
  const found = project.sets.find((set) => set.name.toLowerCase() === name.toLowerCase());
  return found?.id ?? project.sets[0]?.id;
}

function buildItemsFromTable(table: DataTable, project: Project, blueprint?: Blueprint) {
  const blueprintId = blueprint?.id ?? project.blueprints[0]?.id ?? '';
  return table.rows.map((row) => ({
    id: createId('item'),
    name: String(row.data.name ?? row.data.title ?? `Item ${row.id}`),
    setId: row.setId ?? project.sets[0]?.id ?? '',
    blueprintId,
    data: row.data,
    quantity: row.quantity ?? 1,
    sourceRowId: row.id,
  }));
}
