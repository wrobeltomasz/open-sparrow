import { debugLog } from '../debug.js';
import { showToast } from '../toast.js';
import { state, getState, setFilteredData, resetFiltersState } from './state.js';
import { fetchTableData, preloadForeignKeys } from './api.js';
import { renderThead } from './header/render.js';
import { renderTbody } from './body/render.js';
import { loadCommentCounts } from './comments/counts.js';
import { initPreviewPopup, clearPreviewCache } from './comments/preview-popup.js';

export { getState, setFilteredData };

export { buildMenu } from './menu.js';

const userRole = window.USER_ROLE || 'readonly';
const isReadOnly = userRole === 'readonly';

export async function loadTable(schema, table, gridTitleEl, addRowBtn) {
    debugLog('Loading table', table);
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const data = await fetchTableData(table, urlParams);

        state.currentTable = table;
        state.fkCache = new Map();
        clearPreviewCache();
        state.fullData = data.rows || [];
        state.displayedColumns = (data.columns || []).filter(c => {
            if (c === 'id') return false;
            return schema.tables[table].columns[c]?.show_in_grid !== false;
        });
        state.filteredData = state.fullData.slice();
        state.unsortedFilteredData = state.filteredData.slice();
        state.sortState = { column: null, asc: true };
        state.gridTitleEl = gridTitleEl;
        state.addRowBtn = addRowBtn;
        state.containerEl = document.getElementById('grid');

        // Keep legacy window.AppState in sync for grid_actions.js
        window.AppState = window.AppState || {};
        window.AppState.currentTable = table;

        const filterCol = urlParams.get('filter_col');
        const filterVal = urlParams.get('filter_val');
        let displayTitle = data.table?.display_name || table;
        if (urlParams.get('table') === table && filterCol && filterVal !== null) {
            displayTitle += ` (Filtered by ${filterCol}: ${filterVal})`;
        }
        gridTitleEl.textContent = displayTitle;

        if (addRowBtn) {
            if (isReadOnly) {
                addRowBtn.style.display = 'none';
            } else {
                addRowBtn.style.display = '';
                addRowBtn.disabled = false;
                addRowBtn.onclick = () => {
                    window.location.href = `create.php?table=${table}`;
                };
            }
        }

        await renderGrid(schema);
        document.dispatchEvent(new Event('tableLoaded'));
    } catch (err) {
        console.error('Failed to load table data:', err);
        showToast(`Cannot load table "${table}". ${err.message}`, 'error');
        if (gridTitleEl) gridTitleEl.textContent = `Error loading "${table}"`;
    }
}

// Injected by app.js after all modules load to break circular dependency
// pagination.js imports renderGrid from grid.js, so grid/index.js must not import pagination.js
let _getPageRows = () => state.filteredData.slice(0, 10);
let _setupPagination = () => {};

export function injectPagination(getPageRows, setupPagination) {
    _getPageRows = getPageRows;
    _setupPagination = setupPagination;
}

export async function renderGrid(schema) {
    if (!state.currentTable) return;

    await preloadForeignKeys(schema);

    const onRerender = () => renderGrid(schema);
    const onTableReload = () => loadTable(
        schema, state.currentTable, state.gridTitleEl, state.addRowBtn
    );

    const table = document.createElement('table');
    table.appendChild(renderThead(schema, isReadOnly, onRerender));

    const { tbody, pageRows } = await renderTbody(schema, isReadOnly, _getPageRows, onTableReload);
    table.appendChild(tbody);

    const container = state.containerEl || document.getElementById('grid');
    container.replaceChildren(table);

    _setupPagination(schema);
    debugLog('Grid rendered', { rows: pageRows.length });
    loadCommentCounts(pageRows);
}

export async function resetFilters(schema) {
    resetFiltersState();
    await renderGrid(schema);
}

document.addEventListener('DOMContentLoaded', () => {
    initPreviewPopup();
});
