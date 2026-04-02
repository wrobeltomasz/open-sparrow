import { buildMenu, loadTable, renderGrid, getState, setFilteredData, resetFilters } from './grid.js';
import { debugLog } from './debug.js';
import { setupPagination } from './pagination.js';
import { initWorkflows } from './workflows.js';

const menuEl = document.getElementById('menu');
const gridTitleEl = document.getElementById('gridTitle');
const addRowBtn = document.getElementById('addRow');
const searchEl = document.getElementById('globalSearch');
const columnFilterEl = document.getElementById('columnFilter');
const clearFiltersBtn = document.getElementById('clearFilters');
let searchTimeout;

// Store cumulative active filters globally
let activeFilters = {
    search: '',
    columns: {}
};

// Helper to render HTML for menu icons
function renderIconHtml(iconVal, fallbackPath) {
    const icon = iconVal || fallbackPath;
    if (icon.includes('/') || icon.includes('.')) {
        return `<img src="${icon}" alt="" style="width:20px; height:20px; vertical-align:middle; margin-right:8px;">`;
    }
    return `<span style="font-size:1.2em; margin-right:8px; vertical-align:middle;">${icon}</span>`;
}

// Initialize application on DOM load
document.addEventListener('DOMContentLoaded', async () => {
    if (typeof schema !== 'undefined' && Object.keys(schema.tables).length > 0) {
        const firstTableName = Object.keys(schema.tables)[0];
        
        buildMenu(schema, menuEl, gridTitleEl, addRowBtn);
        const navList = menuEl.querySelector('ul') || menuEl;
        
        let dashName = 'Dashboard';
        let dashIconHtml = renderIconHtml('', 'assets/icons/dashboard.png');
        let calName = 'Calendar';
        let calIconHtml = renderIconHtml('', 'assets/icons/calendar.png');

        try {
            const dashRes = await fetch('api.php?api=dashboard&v=' + Date.now());
            if (dashRes.ok) {
                const dashCfg = await dashRes.json();
                if (dashCfg.menu_name) dashName = dashCfg.menu_name;
                dashIconHtml = renderIconHtml(dashCfg.menu_icon, 'assets/icons/dashboard.png');
            }
        } catch(e) { console.warn('Could not load dashboard config', e); }

        try {
            const calRes = await fetch('api.php?api=calendar&v=' + Date.now());
            if (calRes.ok) {
                const calCfg = await calRes.json();
                if (calCfg.menu_name) calName = calCfg.menu_name;
                calIconHtml = renderIconHtml(calCfg.menu_icon, 'assets/icons/calendar.png');
            }
        } catch(e) { console.warn('Could not load calendar config', e); }

        const dashItem = document.createElement('li');
        const dashLink = document.createElement('a');
        dashLink.href = 'dashboard.php';
        dashLink.className = 'custom-nav-link';
        dashLink.innerHTML = `${dashIconHtml} <span style="vertical-align:middle;">${dashName}</span>`;

        const calItem = document.createElement('li');
        const calLink = document.createElement('a');
        calLink.href = 'calendar.php';
        calLink.className = 'custom-nav-link';
        calLink.innerHTML = `${calIconHtml} <span style="vertical-align:middle;">${calName}</span>`;

        if (navList.tagName === 'UL') {
            dashItem.appendChild(dashLink);
            calItem.appendChild(calLink);
            navList.prepend(calItem);
            navList.prepend(dashItem);
        } else {
            menuEl.prepend(calLink);
            menuEl.prepend(dashLink);
        }
        
        // Dynamically create a container for Active Filter Pills
        const gridSection = document.getElementById('gridSection');
        if (gridSection) {
            const pillsContainer = document.createElement('div');
            pillsContainer.id = 'filterPills';
            pillsContainer.style.cssText = 'display: none; gap: 8px; flex-wrap: wrap; padding: 0 1.25rem; background: var(--panel); border-bottom: 1px solid var(--border-light);';
            gridTitleEl.after(pillsContainer);
        }

        const gridContainerEl = document.getElementById('grid');
        if (gridContainerEl) { initWorkflows(navList, gridContainerEl, gridTitleEl); }
        
        loadTable(schema, firstTableName, gridTitleEl, addRowBtn);
        setupPagination(schema);
    }
});

// Populate column filter dropdown dynamically
function populateColumnFilter() {
    const { displayedColumns, currentTable } = getState();
    columnFilterEl.innerHTML = `<option value="">Select column to filter...</option>`;
    
    displayedColumns.forEach(col => {
        const opt = document.createElement("option");
        opt.value = col; 
        
        let displayName = col; 
        if (currentTable && schema.tables[currentTable]?.columns[col]?.display_name) {
            displayName = schema.tables[currentTable].columns[col].display_name;
        } else {
            for (const tKey in schema.tables) {
                if (schema.tables[tKey].columns[col]?.display_name) {
                    displayName = schema.tables[tKey].columns[col].display_name;
                    break;
                }
            }
        }
        opt.textContent = displayName; 
        columnFilterEl.appendChild(opt);
    });
}

// Update the global activeFilters state
function updateColumnFilterState(col, type, data) {
    if (!data || data.empty) {
        delete activeFilters.columns[col];
    } else {
        activeFilters.columns[col] = { type, ...data };
    }
}

// Render dynamic filters based on column type and populate with existing state
function handleColumnFilterChange() {
    const { currentTable, fullData } = getState();
    const col = columnFilterEl.value;
    const filterBar = document.getElementById('filterBar');
    
    filterBar.innerHTML = '';
    if (!col || !currentTable || !schema.tables[currentTable]) return;

    const colCfg = schema.tables[currentTable].columns[col] || {};
    const type = (colCfg.type || '').toLowerCase();
    const isFK = schema.tables[currentTable].foreign_keys && schema.tables[currentTable].foreign_keys[col];

    // Retrieve existing filter state for the selected column to pre-fill inputs
    const existingFilter = activeFilters.columns[col] || {};

    if (isFK || type === 'enum') {
        const select = document.createElement('select');
        select.id = 'dictFilter';
        const displayName = colCfg.display_name || col;
        select.innerHTML = `<option value="">${displayName}: All</option>`;
        
        let options = [];
        if (type === 'enum' && Array.isArray(colCfg.options)) {
            options = colCfg.options.map(opt => ({ val: opt, label: opt }));
        } else {
            const uniqueVals = new Map();
            fullData.forEach(row => {
                const val = row[col];
                const label = row[col + '__display'] || val;
                if (val !== null && val !== undefined && val !== '') {
                    uniqueVals.set(val, label);
                }
            });
            options = Array.from(uniqueVals.entries()).map(([val, label]) => ({ val, label }));
        }
        
        options.sort((a, b) => String(a.label).localeCompare(String(b.label)));
        options.forEach(opt => {
            const o = document.createElement('option');
            o.value = opt.val;
            o.textContent = opt.label;
            if (existingFilter.val === String(opt.val)) o.selected = true;
            select.appendChild(o);
        });
        
        select.addEventListener('change', () => { 
            const selectedText = select.options[select.selectedIndex].text;
            updateColumnFilterState(col, 'dict', { val: select.value, label: selectedText, empty: select.value === '' });
            applySearch(); 
        });
        filterBar.appendChild(select);
    }
    else if (type.includes('date')) {
        const dateContainer = document.createElement('div');
        dateContainer.style.cssText = 'display: flex; gap: 8px; align-items: center;';

        const spanFrom = document.createElement('span');
        spanFrom.textContent = 'From:';
        spanFrom.style.cssText = 'font-size: 13px; color: #ffffff;';

        const inputFrom = document.createElement('input');
        inputFrom.type = 'date';
        inputFrom.className = 'date-filter';
        if (existingFilter.from) inputFrom.value = existingFilter.from;

        const spanTo = document.createElement('span');
        spanTo.textContent = 'To:';
        spanTo.style.cssText = 'font-size: 13px; color: #ffffff;';

        const inputTo = document.createElement('input');
        inputTo.type = 'date';
        inputTo.className = 'date-filter';
        if (existingFilter.to) inputTo.value = existingFilter.to;

        const updateDateState = () => {
            const fromVal = inputFrom.value;
            const toVal = inputTo.value;
            updateColumnFilterState(col, 'date', { from: fromVal, to: toVal, empty: !fromVal && !toVal });
            applySearch();
        };

        inputFrom.addEventListener('change', updateDateState);
        inputTo.addEventListener('change', updateDateState);

        dateContainer.appendChild(spanFrom);
        dateContainer.appendChild(inputFrom);
        dateContainer.appendChild(spanTo);
        dateContainer.appendChild(inputTo);
        filterBar.appendChild(dateContainer);
    } 
    else if (type.includes('int') || type.includes('dec') || type.includes('num') || type.includes('float')) {
        const numContainer = document.createElement('div');
        numContainer.style.cssText = 'display: flex; gap: 8px; align-items: center;';

        const spanMin = document.createElement('span');
        spanMin.textContent = 'Min:';
        spanMin.style.cssText = 'font-size: 13px; color: #ffffff;';

        const inputMin = document.createElement('input');
        inputMin.type = 'number';
        inputMin.className = 'date-filter'; 
        if (existingFilter.min !== undefined && existingFilter.min !== null) inputMin.value = existingFilter.min;

        const spanMax = document.createElement('span');
        spanMax.textContent = 'Max:';
        spanMax.style.cssText = 'font-size: 13px; color: #ffffff;';

        const inputMax = document.createElement('input');
        inputMax.type = 'number';
        inputMax.className = 'date-filter'; 
        if (existingFilter.max !== undefined && existingFilter.max !== null) inputMax.value = existingFilter.max;

        const updateNumState = () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                const minVal = inputMin.value !== '' ? parseFloat(inputMin.value) : null;
                const maxVal = inputMax.value !== '' ? parseFloat(inputMax.value) : null;
                updateColumnFilterState(col, 'num', { min: minVal, max: maxVal, empty: minVal === null && maxVal === null });
                applySearch();
            }, 300);
        };

        inputMin.addEventListener('input', updateNumState);
        inputMax.addEventListener('input', updateNumState);

        numContainer.appendChild(spanMin);
        numContainer.appendChild(inputMin);
        numContainer.appendChild(spanMax);
        numContainer.appendChild(inputMax);
        filterBar.appendChild(numContainer);
    }
    else if (type.includes('bool')) {
        const select = document.createElement('select');
        const displayName = colCfg.display_name || col;

        const optAll = document.createElement('option');
        optAll.value = '';
        optAll.textContent = `${displayName}: All`;
        select.appendChild(optAll);

        const optTrue = document.createElement('option');
        optTrue.value = 'true';
        optTrue.textContent = 'Yes';
        select.appendChild(optTrue);

        const optFalse = document.createElement('option');
        optFalse.value = 'false';
        optFalse.textContent = 'No';
        select.appendChild(optFalse);

        if (existingFilter.val) select.value = existingFilter.val;
        
        select.addEventListener('change', () => { 
            updateColumnFilterState(col, 'bool', { val: select.value, empty: select.value === '' });
            applySearch(); 
        });
        filterBar.appendChild(select);
    }
}

// Render active filters as removable pills
function renderFilterPills() {
    const pillsContainer = document.getElementById('filterPills');
    if (!pillsContainer) return;

    pillsContainer.innerHTML = '';
    let hasPills = false;
    const { currentTable } = getState();

    // Reusable function to render a single pill
    const createPill = (label, onRemove) => {
        hasPills = true;
        const pill = document.createElement('div');
        pill.style.cssText = 'background: var(--accent-light); color: var(--accent-dark); border: 1px solid var(--accent-mid); border-radius: 12px; padding: 4px 10px; font-size: 12px; display: inline-flex; align-items: center; gap: 8px; font-weight: 500; margin-top: 10px; margin-bottom: 10px;';
        
        const textSpan = document.createElement('span');
        textSpan.textContent = label;
        
        const closeBtn = document.createElement('span');
        closeBtn.innerHTML = '×';
        closeBtn.style.cssText = 'cursor: pointer; color: var(--danger); font-size: 16px; font-weight: bold; line-height: 1; padding-left: 4px;';
        closeBtn.title = "Remove filter";
        
        closeBtn.onclick = () => {
            onRemove();
            handleColumnFilterChange();
            applySearch();
        };

        pill.appendChild(textSpan);
        pill.appendChild(closeBtn);
        pillsContainer.appendChild(pill);
    };

    // Render global text search pill
    if (activeFilters.search) {
        createPill(`Search: "${activeFilters.search}"`, () => {
            activeFilters.search = '';
            searchEl.value = '';
        });
    }

    // Render cumulative column pills
    if (currentTable && schema.tables[currentTable]) {
        for (const [col, filter] of Object.entries(activeFilters.columns)) {
            const colCfg = schema.tables[currentTable].columns[col] || {};
            const colName = colCfg.display_name || col;

            if (filter.type === 'dict') {
                createPill(`${colName}: ${filter.label}`, () => delete activeFilters.columns[col]);
            } 
            else if (filter.type === 'bool') {
                createPill(`${colName}: ${filter.val === 'true' ? 'Yes' : 'No'}`, () => delete activeFilters.columns[col]);
            } 
            else if (filter.type === 'date') {
                let label = `${colName}: `;
                if (filter.from && filter.to) label += `${filter.from} to ${filter.to}`;
                else if (filter.from) label += `From ${filter.from}`;
                else if (filter.to) label += `Up to ${filter.to}`;
                createPill(label, () => delete activeFilters.columns[col]);
            } 
            else if (filter.type === 'num') {
                let label = `${colName}: `;
                if (filter.min !== null && filter.max !== null) label += `${filter.min} - ${filter.max}`;
                else if (filter.min !== null) label += `Min ${filter.min}`;
                else if (filter.max !== null) label += `Max ${filter.max}`;
                createPill(label, () => delete activeFilters.columns[col]);
            }
        }
    }

    pillsContainer.style.display = hasPills ? 'flex' : 'none';
}

// Event triggered when a table finishes rendering initially
document.addEventListener("tableLoaded", () => {
    // Reset active filters on table change
    activeFilters = { search: '', columns: {} };
    searchEl.value = '';
    
    populateColumnFilter();
    handleColumnFilterChange();
    renderFilterPills();
    updateClearFiltersVisibility();
});

// Evaluate all stacked filters against the row data
async function applySearch() {
    const { fullData, displayedColumns } = getState();
    const q = activeFilters.search.toLowerCase();

    let rows = fullData.filter(row => {
        // Iterate through all stored column filters
        for (const [col, filter] of Object.entries(activeFilters.columns)) {
            if (filter.type === 'dict') {
                if (String(row[col]) !== String(filter.val)) return false;
            }
            else if (filter.type === 'bool') {
                const rowBool = (row[col] === true || row[col] === 't' || row[col] === 'true' || row[col] === 1);
                const targetBool = (filter.val === 'true');
                if (rowBool !== targetBool) return false;
            }
            else if (filter.type === 'date') {
                const rawDateStr = (row[col] ?? '').toString().substring(0, 10);
                if (!rawDateStr) return false; 
                if (filter.from && rawDateStr < filter.from) return false;
                if (filter.to && rawDateStr > filter.to) return false;
            }
            else if (filter.type === 'num') {
                const rawNum = parseFloat(row[col]);
                if (isNaN(rawNum)) return false; 
                if (filter.min !== null && rawNum < filter.min) return false;
                if (filter.max !== null && rawNum > filter.max) return false;
            }
        }

        // Global text search across all visible columns
        if (q) {
            const matchesText = displayedColumns.some(colName => {
                const raw = (row[colName] ?? '').toString().toLowerCase();
                const display = (row[colName + '__display'] ?? '').toString().toLowerCase();
                return raw.includes(q) || display.includes(q);
            });
            if (!matchesText) return false;
        }

        return true;
    });

    setFilteredData(rows);
    await renderGrid(schema);
    renderFilterPills();
    updateClearFiltersVisibility();
    debugLog("Search Applied", { activeFilters, results: rows.length });
}

// Show the global Reset button only when any filter exists
function updateClearFiltersVisibility() {
    const hasSearch = activeFilters.search !== '';
    const hasColumns = Object.keys(activeFilters.columns).length > 0;
    clearFiltersBtn.style.display = (hasSearch || hasColumns) ? 'inline-block' : 'none';
}

// Completely clear the filter state globally
clearFiltersBtn.addEventListener('click', async () => {
    activeFilters = { search: '', columns: {} };
    searchEl.value = '';
    columnFilterEl.value = '';
    
    handleColumnFilterChange();
    renderFilterPills();
    updateClearFiltersVisibility();
    
    await resetFilters(schema);
});

// Sync the search input with the filter state
searchEl.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        activeFilters.search = searchEl.value;
        applySearch();
    }, 300);
});

// React to dropdown column change
columnFilterEl.addEventListener('change', () => {
    handleColumnFilterChange();
});