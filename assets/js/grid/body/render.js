import { deleteRow } from '../../grid_actions.js';
import { state } from '../state.js';
import { CellRenderer } from '../cells/registry.js';
import { buildExpandButton } from './drilldown.js';

// Import cell renderers so they self-register
import '../cells/fk-cell.js';
import '../cells/enum-cell.js';
import '../cells/boolean-cell.js';
import '../cells/date-cell.js';
import '../cells/text-cell.js';

function resolveCellType(colCfg, hasFk) {
    if (hasFk) return 'fk';
    const t = (colCfg.type || '').toLowerCase();
    if (t === 'enum') return 'enum';
    if (t.includes('boolean')) return 'boolean';
    if (t.includes('date')) return 'date';
    return 'text';
}

export async function renderTbody(schema, isReadOnly, getPageRows, onTableReload) {
    const tbody = document.createElement('tbody');
    const pageRows = getPageRows();
    const subtables = schema.tables[state.currentTable]?.subtables || [];
    const hasSubtables = subtables.length > 0;

    for (const row of pageRows) {
        const tr = document.createElement('tr');

        if (hasSubtables) {
            tr.appendChild(buildExpandButton(row, schema, tr));
        }

        for (const col of state.displayedColumns) {
            const colCfg = schema.tables[state.currentTable].columns[col] || {};
            const hasFk = Boolean(schema.tables[state.currentTable].foreign_keys?.[col]);
            const type = resolveCellType(colCfg, hasFk);
            const td = await CellRenderer.render(type, { row, col, colCfg, schema, isReadOnly });
            tr.appendChild(td);
        }

        // Comments column
        const tdComments = document.createElement('td');
        tdComments.dataset.commentRowId = String(row['id']);
        tr.appendChild(tdComments);

        // Actions column
        if (!isReadOnly) {
            tr.appendChild(buildActionsCell(row, schema, isReadOnly, onTableReload));
        }

        tbody.appendChild(tr);
    }

    return { tbody, pageRows };
}

function buildActionsCell(row, schema, isReadOnly, onTableReload) {
    const tdActions = document.createElement('td');

    const editBtn = document.createElement('button');
    editBtn.textContent = 'Edit';
    editBtn.style.marginRight = '8px';
    editBtn.addEventListener('click', () => {
        window.location.href = `edit.php?table=${state.currentTable}&id=${row['id']}`;
    });
    tdActions.appendChild(editBtn);

    const delBtn = document.createElement('button');
    delBtn.textContent = 'Delete';
    delBtn.className = 'danger';
    delBtn.addEventListener('click', async () => {
        if (!confirm('Are you sure you want to delete this record? This operation cannot be undone.')) return;
        const result = await deleteRow(row['id']);
        if (result?.ok) await onTableReload();
    });
    tdActions.appendChild(delBtn);

    return tdActions;
}
