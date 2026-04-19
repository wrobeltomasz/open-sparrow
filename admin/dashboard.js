// admin/dashboard.js
import { createTextInput, createSelectInput, createColorInput, createIconPicker, createCheckbox, renderGlobalSettings } from './ui.js';

// Added new widget types for vertical bar and pie charts
export const WIDGET_TYPES = [
    { value: 'kpi_card', label: 'KPI Card' },
    { value: 'stat_card', label: 'Stat Card (Row Count)' },
    { value: 'bar_chart', label: 'Bar Chart (Horizontal)' },
    { value: 'vertical_bar_chart', label: 'Bar Chart (Vertical)' },
    { value: 'pie_chart', label: 'Pie Chart' },
    { value: 'list', label: 'Data List' }
];

// Datalist initialization removed as we now use standard select inputs
export function initDashboardUI() {
    // Left empty to maintain compatibility if called elsewhere
}

export function renderDashboardLayout(ctx) {
    renderGlobalSettings(ctx, {
        title: 'Dashboard Global Settings',
        defaultMenuName: 'Dashboard',
        includeHidden: true,
        onAfter: ({ workspaceEl, currentConfig }) => {
            const layoutTitle = document.createElement('h4');
            layoutTitle.textContent = 'Grid Layout (CSS)';
            layoutTitle.style.marginTop = '20px';
            workspaceEl.appendChild(layoutTitle);

            workspaceEl.appendChild(createTextInput('layout_cols', 'Grid Columns (CSS)', currentConfig.layout.columns, v => currentConfig.layout.columns = v));
            workspaceEl.appendChild(createTextInput('layout_gap', 'Grid Gap (CSS)', currentConfig.layout.gap, v => currentConfig.layout.gap = v));
        },
    });
}

export function renderDashboardEditor(key, itemData, isArray, ctx) {
    const { workspaceEl, getTableOptions, getColumnOptionsForTable, renderEditor, renderSidebar } = ctx;
    
    workspaceEl.appendChild(createTextInput('id', 'Widget ID (Unique)', itemData.id, v => itemData.id = v));
    
    // Replaced datalist with standard select input for widget type
    workspaceEl.appendChild(createSelectInput('type', 'Widget Type', WIDGET_TYPES, itemData.type || '', v => {
        itemData.type = v; itemData.query = {}; renderEditor(key, itemData, isArray); 
    }));
    
    workspaceEl.appendChild(createTextInput('title', 'Widget Title', itemData.title, v => { itemData.title = v; renderSidebar(); }));
    workspaceEl.appendChild(createSelectInput('table', 'Source Table', getTableOptions(), itemData.table, v => {
        itemData.table = v; renderEditor(key, itemData, isArray); 
    }));

    const queryBlock = document.createElement('div');
    queryBlock.style.borderLeft = '2px solid var(--accent)'; queryBlock.style.paddingLeft = '15px'; queryBlock.style.marginLeft = '15px'; queryBlock.style.marginBottom = '20px';
    queryBlock.innerHTML = '<h4>Database Query Configuration</h4>';
    
    if (typeof itemData.query !== 'object' || itemData.query === null) itemData.query = {};
    const q = itemData.query;
    const colOptions = getColumnOptionsForTable(itemData.table);

    if (itemData.type === 'kpi_card') {
        q.type = q.type || 'count'; q.column = q.column || 'id';
        queryBlock.appendChild(createSelectInput('q_type', 'Aggregation Function', [{value:'count',label:'Count'}, {value:'sum',label:'Sum'}, {value:'avg',label:'Average'}], q.type, v => q.type = v));
        queryBlock.appendChild(createSelectInput('q_col', 'Target Column', colOptions, q.column, v => q.column = v));
    } else if (itemData.type === 'stat_card') {
        q.type = 'count'; 
        q.column = q.column || 'id';
    } else if (['bar_chart', 'vertical_bar_chart', 'pie_chart'].includes(itemData.type)) {
        // Grouped configuration for all chart types
        q.type = 'group_by'; 
        queryBlock.appendChild(createSelectInput('q_group', 'Group By Column', colOptions, q.group_column || '', v => q.group_column = v));
        queryBlock.appendChild(createSelectInput('q_agg_col', 'Aggregation Column', colOptions, q.agg_column || 'id', v => q.agg_column = v));
        queryBlock.appendChild(createSelectInput('q_agg_type', 'Aggregation Function', [{value:'count',label:'Count'}, {value:'sum',label:'Sum'}], q.agg_type || 'count', v => q.agg_type = v));
    } else if (itemData.type === 'list') {
        queryBlock.appendChild(createTextInput('q_limit', 'Limit Rows', q.limit || 5, v => q.limit = parseInt(v) || 5));
        queryBlock.appendChild(createSelectInput('q_order', 'Order By Column', colOptions, q.order_by || 'id', v => q.order_by = v));
        queryBlock.appendChild(createSelectInput('q_dir', 'Order Direction', [{value:'DESC',label:'Descending'}, {value:'ASC',label:'Ascending'}], q.dir || 'DESC', v => q.dir = v));
    }

    // Add general WHERE clause for all widget types
    queryBlock.appendChild(createTextInput('q_where', 'WHERE Clause (Optional SQL, e.g. status = 1)', q.where || '', v => q.where = v));
    workspaceEl.appendChild(queryBlock);

    workspaceEl.appendChild(createIconPicker('icon', 'Icon Path', itemData.icon || '', v => {
        if (v && v.trim() !== '') itemData.icon = v;
        else delete itemData.icon;
    }));
    
    workspaceEl.appendChild(createColorInput('color', 'Accent Color', itemData.color, v => itemData.color = v));
    
    if (itemData.type === 'list') {
        const colsStr = Array.isArray(itemData.display_columns) ? itemData.display_columns.join(', ') : '';
        workspaceEl.appendChild(createTextInput('display_columns', 'Columns to Display (Comma separated)', colsStr, v => {
            itemData.display_columns = v.split(',').map(s => s.trim()).filter(s => s);
        }));
    }
}