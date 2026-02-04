import React, { useMemo, useState } from 'react';
import Papa from 'papaparse';
import type { Blueprint, DataRow, DataTable, Project } from '@cardsmith/core';
import { createId, resolvePath } from '@cardsmith/core';
import { Button, Panel, Row, Select } from '../../components/ui';
import { useAppStore } from '../../state/appStore';
import { useTranslation } from 'react-i18next';

export function DataTableScreen(props: { project: Project; onChange: (project: Project) => void }) {
  const { t } = useTranslation();
  const { project, onChange } = props;
  const { activeBlueprintId, activeTableId, setPreviewRowId, setActiveTableId } = useAppStore();
  const [selectedRowId, setSelectedRowId] = useState<string | undefined>();

  const table = project.dataTables.find((tbl) => tbl.id === activeTableId) ?? project.dataTables[0];
  const blueprint: Blueprint | undefined =
    project.blueprints.find((bp) => bp.id === activeBlueprintId) ?? project.blueprints[0];

  const columns = useMemo(() => {
    if (!table) return [];
    if (table.columns?.length) return table.columns;
    return collectColumns(table.rows.map((row) => row.data));
  }, [table]);

  const updateTable = (nextTable: DataTable) => {
    const nextProject = {
      ...project,
      dataTables: [nextTable],
      items: buildItemsFromTable(
        nextTable,
        project,
        blueprint,
        (rowId) => t('project.itemFallback', { id: rowId }),
      ),
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

      const normalizedRows = rows.map((row) => normalizeRowData(row));

      const dataRows: DataRow[] = rows.map((row, index) => {
        const quantity = row.quantity ?? row.qty ?? row.Quantity;
        const setName = row.set ?? row.Set ?? row.setName;
        const setId = findSetIdByName(project, String(setName ?? ''));
        return {
          id: createId('row'),
          data: normalizedRows[index],
          quantity: Number(quantity) || 1,
          setId,
          blueprintId: blueprint?.id,
        };
      });

      const nextTable: DataTable = {
        id: createId('table'),
        name: t('data.mainTable'),
        columns: collectColumns(normalizedRows),
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
      : { id: createId('table'), name: t('data.mainTable'), columns: [], rows: [nextRow] };
    updateTable(nextTable);
  };

  const updateCell = (rowId: string, key: string, value: any) => {
    if (!table) return;
    const existingColumns = table.columns ?? [];
    const nextColumns = existingColumns.includes(key) ? existingColumns : [...existingColumns, key];
    const nextTable = {
      ...table,
      columns: nextColumns,
      rows: table.rows.map((row) =>
        row.id === rowId ? { ...row, data: setPathValue(row.data, key, value) } : row,
      ),
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
        <Panel title={t('data.title')} subtitle={t('data.subtitle')}>
          <div className="list">
            <Row gap={10}>
              <Button onClick={importData}>{t('data.import')}</Button>
              <Button variant="outline" onClick={addRow}>{t('data.addRow')}</Button>
            </Row>
            {!table ? (
              <div className="empty">{t('data.noData')}</div>
            ) : (
              <div style={{ overflow: 'auto', maxHeight: 520 }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>{t('data.rowColumn')}</th>
                      {columns.map((col) => (
                        <th key={col}>{col}</th>
                      ))}
                      <th>{t('data.quantityColumn')}</th>
                      <th>{t('data.setColumn')}</th>
                      <th>{t('data.actionsColumn')}</th>
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
                              value={resolvePath(row.data, col) ?? ''}
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
                          <Button size="sm" variant="danger" onClick={() => removeRow(row.id)}>{t('data.deleteRow')}</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Panel>

        <Panel title={t('data.bindingsTitle')} subtitle={t('data.bindingsSubtitle')}>
          <div className="list">
            {bindingElements.length === 0 ? (
              <div className="empty">{t('data.noBindings')}</div>
            ) : (
              bindingElements.map((el) => (
                <div key={el.id}>
                  <div className="hint">{el.name}</div>
                  <Select
                    value={el.bindingKey ?? ''}
                    onChange={(e) => updateBinding(el.id, e.target.value)}
                  >
                    <option value="">{t('data.noBinding')}</option>
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
  rows.forEach((row) => flattenKeys(row, '', colSet));
  return Array.from(colSet);
}

function flattenKeys(value: any, prefix: string, colSet: Set<string>) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    if (prefix) colSet.add(prefix);
    return;
  }
  Object.entries(value).forEach(([key, next]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (next && typeof next === 'object' && !Array.isArray(next)) {
      flattenKeys(next, path, colSet);
      return;
    }
    colSet.add(path);
  });
}

function normalizeRowData(row: Record<string, any>) {
  const output: Record<string, any> = {};
  Object.entries(row).forEach(([key, value]) => {
    if (key.includes('.')) {
      assignPath(output, key, value);
    } else {
      output[key] = value;
    }
  });
  return output;
}

function assignPath(target: Record<string, any>, path: string, value: any) {
  const parts = path.split('.');
  let cursor: Record<string, any> = target;
  for (let i = 0; i < parts.length - 1; i += 1) {
    const part = parts[i];
    const next = cursor[part];
    if (!next || typeof next !== 'object' || Array.isArray(next)) {
      cursor[part] = {};
    }
    cursor = cursor[part];
  }
  cursor[parts[parts.length - 1]] = value;
}

function setPathValue(data: Record<string, any>, path: string, value: any) {
  if (!path.includes('.')) {
    return { ...data, [path]: value };
  }
  const result: Record<string, any> = { ...data };
  const parts = path.split('.');
  let cursor: Record<string, any> = result;
  for (let i = 0; i < parts.length - 1; i += 1) {
    const part = parts[i];
    const next = cursor[part];
    if (next && typeof next === 'object' && !Array.isArray(next)) {
      cursor[part] = { ...next };
    } else {
      cursor[part] = {};
    }
    cursor = cursor[part];
  }
  cursor[parts[parts.length - 1]] = value;
  return result;
}

function findSetIdByName(project: Project, name: string) {
  if (!name) return project.sets[0]?.id;
  const found = project.sets.find((set) => set.name.toLowerCase() === name.toLowerCase());
  return found?.id ?? project.sets[0]?.id;
}

function buildItemsFromTable(
  table: DataTable,
  project: Project,
  blueprint: Blueprint | undefined,
  itemFallback: (rowId: string) => string,
) {
  const blueprintId = blueprint?.id ?? project.blueprints[0]?.id ?? '';
  return table.rows.map((row) => ({
    id: createId('item'),
    name: String(row.data.name ?? row.data.title ?? itemFallback(row.id)),
    setId: row.setId ?? project.sets[0]?.id ?? '',
    blueprintId,
    data: row.data,
    quantity: row.quantity ?? 1,
    sourceRowId: row.id,
  }));
}
