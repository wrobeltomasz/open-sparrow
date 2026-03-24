// admin/dashboard.js
import { createTextInput, createSelectInput, createColorInput, createDatalistInput, createIconPicker } from './ui.js';

export const WIDGET_TYPES = [
    { value: 'kpi_card', label: 'KPI Card' },
    { value: 'bar_chart', label: 'Bar Chart' },
    { value: 'list', label: 'Data List' }
];

export function initDashboardUI() {
    if (!document.getElementById('widget-types-list')) {
        const dl = document.createElement('datalist');
        dl.id = 'widget-types-list';
        WIDGET_TYPES.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.value; option.textContent = opt.label;
            dl.appendChild(option);
        });
        document.body.appendChild(dl);
    }
}

export function renderDashboardLayout(ctx) {
    const { workspaceEl, currentConfig } = ctx;
    workspaceEl.innerHTML = `<h3>Dashboard Global Settings</h3>`;
    
    workspaceEl.appendChild(createTextInput('menu_name', 'Menu Display Name', currentConfig.menu_name || 'Dashboard', v => currentConfig.menu_name = v));
    workspaceEl.appendChild(createIconPicker('menu_icon', 'Menu Icon', currentConfig.menu_icon || '', v => {
        if (v && v.trim() !== '') currentConfig.menu_icon = v;
        else delete currentConfig.menu_icon;
    }));

    const layoutTitle = document.createElement('h4');
    layoutTitle.textContent = 'Grid Layout (CSS)';
    layoutTitle.style.marginTop = '20px';
    workspaceEl.appendChild(layoutTitle);

    workspaceEl.appendChild(createTextInput('layout_cols', 'Grid Columns (CSS)', currentConfig.layout.columns, v => currentConfig.layout.columns = v));
    workspaceEl.appendChild(createTextInput('layout_gap', 'Grid Gap (CSS)', currentConfig.layout.gap, v => currentConfig.layout.gap = v));

    const statsTitle = document.createElement('h4');
    statsTitle.textContent = 'Main Table Quick Stats';
    statsTitle.style.marginTop = '20px';
    workspaceEl.appendChild(statsTitle);

    const mainTable = Array.isArray(currentConfig.widgets)
        ? (currentConfig.widgets.find(w => w && w.table)?.table || '')
        : '';

    const whereInput = createTextInput(
        'main_table_where',
        'Main Table WHERE Clause (optional, without WHERE)',
        currentConfig.main_table_where || '',
        async v => {
            currentConfig.main_table_where = v;
            await refreshMainTableCount();
        }
    );
    workspaceEl.appendChild(whereInput);

    const countCard = document.createElement('div');
    countCard.style.border = '1px solid #dbe2ea';
    countCard.style.borderRadius = '8px';
    countCard.style.padding = '14px';
    countCard.style.background = '#f8fafc';
    countCard.style.maxWidth = '360px';

    const countLabel = document.createElement('div');
    countLabel.style.fontSize = '13px';
    countLabel.style.color = '#64748b';
    countLabel.textContent = mainTable
        ? `Total rows in "${mainTable}"`
        : 'Total rows in main table';

    const countValue = document.createElement('div');
    countValue.style.fontSize = '28px';
    countValue.style.fontWeight = '700';
    countValue.style.color = '#0f172a';
    countValue.style.marginTop = '6px';
    countValue.textContent = '-';

    const countHint = document.createElement('div');
    countHint.style.fontSize = '12px';
    countHint.style.color = '#64748b';
    countHint.style.marginTop = '8px';
    countHint.textContent = mainTable
        ? 'Uses first configured widget table as main table.'
        : 'Configure at least one widget table to see row count.';

    countCard.appendChild(countLabel);
    countCard.appendChild(countValue);
    countCard.appendChild(countHint);
    workspaceEl.appendChild(countCard);

    async function refreshMainTableCount() {
        if (!mainTable) {
            countValue.textContent = '-';
            return;
        }

        countValue.textContent = '...';
        try {
            const params = new URLSearchParams({
                action: 'dashboard_main_table_count',
                table: mainTable
            });

            const whereClause = (currentConfig.main_table_where || '').trim();
            if (whereClause) {
                params.set('where', whereClause);
            }

            const res = await fetch(`api.php?${params.toString()}`);
            const data = await res.json();

            if (!res.ok || data.status !== 'success') {
                throw new Error(data.error || 'Failed to fetch row count.');
            }

            countValue.textContent = String(data.total_rows ?? 0);
            countHint.textContent = whereClause
                ? `Filtered by: ${whereClause}`
                : 'Unfiltered total row count.';
        } catch (err) {
            countValue.textContent = '-';
            countHint.textContent = err.message || 'Failed to fetch row count.';
        }
    }

    refreshMainTableCount();
}

export function renderDashboardEditor(key, itemData, isArray, ctx) {
    const { workspaceEl, getTableOptions, getColumnOptionsForTable, renderEditor, renderSidebar } = ctx;
    
    workspaceEl.appendChild(createTextInput('id', 'Widget ID (Unique)', itemData.id, v => itemData.id = v));
    workspaceEl.appendChild(createDatalistInput('type', 'Widget Type', 'widget-types-list', itemData.type, v => {
        itemData.type = v; itemData.query = {}; renderEditor(key, itemData, isArray); 
    }));
    workspaceEl.appendChild(createTextInput('title', 'Widget Title', itemData.title, v => { itemData.title = v; renderSidebar(); }));
    workspaceEl.appendChild(createSelectInput('table', 'Source Table', getTableOptions(), itemData.table, v => {
        itemData.table = v; renderEditor(key, itemData, isArray); 
    }));

    const queryBlock = document.createElement('div');
    queryBlock.style.borderLeft = '2px solid var(--accent)'; queryBlock.style.paddingLeft = '15px'; queryBlock.style.marginLeft = '15px'; queryBlock.style.marginBottom = '20px';
    queryBlock.innerHTML = `<h4>Database Query Configuration</h4>`;
    
    if (typeof itemData.query !== 'object' || itemData.query === null) itemData.query = {};
    const q = itemData.query;
    const colOptions = getColumnOptionsForTable(itemData.table);

    if (itemData.type === 'kpi_card') {
        q.type = q.type || 'count'; q.column = q.column || 'id';
        queryBlock.appendChild(createSelectInput('q_type', 'Aggregation Function', [{value:'count',label:'Count'}, {value:'sum',label:'Sum'}, {value:'avg',label:'Average'}], q.type, v => q.type = v));
        queryBlock.appendChild(createSelectInput('q_col', 'Target Column', colOptions, q.column, v => q.column = v));
        queryBlock.appendChild(createTextInput('q_where', 'WHERE Clause (optional, without WHERE)', q.where || '', v => q.where = v));
        workspaceEl.appendChild(queryBlock);
    } else if (itemData.type === 'bar_chart') {
        q.type = 'group_by'; 
        queryBlock.appendChild(createSelectInput('q_group', 'Group By Column (X-Axis)', colOptions, q.group_column || '', v => q.group_column = v));
        queryBlock.appendChild(createSelectInput('q_agg_col', 'Aggregation Column (Y-Axis)', colOptions, q.agg_column || 'id', v => q.agg_column = v));
        queryBlock.appendChild(createSelectInput('q_agg_type', 'Aggregation Function', [{value:'count',label:'Count'}, {value:'sum',label:'Sum'}], q.agg_type || 'count', v => q.agg_type = v));
        queryBlock.appendChild(createTextInput('q_where', 'WHERE Clause (optional, without WHERE)', q.where || '', v => q.where = v));
        workspaceEl.appendChild(queryBlock);
    } else if (itemData.type === 'list') {
        queryBlock.appendChild(createTextInput('q_limit', 'Limit Rows', q.limit || 5, v => q.limit = parseInt(v) || 5));
        queryBlock.appendChild(createSelectInput('q_order', 'Order By Column', colOptions, q.order_by || 'id', v => q.order_by = v));
        queryBlock.appendChild(createSelectInput('q_dir', 'Order Direction', [{value:'DESC',label:'Descending'}, {value:'ASC',label:'Ascending'}], q.dir || 'DESC', v => q.dir = v));
        queryBlock.appendChild(createTextInput('q_where', 'WHERE Clause (optional, without WHERE)', q.where || '', v => q.where = v));
        workspaceEl.appendChild(queryBlock);
    }

    workspaceEl.appendChild(createIconPicker('icon', 'Icon Path or Emoji', itemData.icon || '', v => {
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