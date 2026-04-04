// admin/app.js
import { moveArrayItem, moveObjectKey, createTextInput, createIconPicker } from './ui.js';
import { syncSchemaTables, renderSchemaEditor, createAddTableButton } from './schema.js';
import { renderDashboardLayout, renderDashboardEditor, initDashboardUI } from './dashboard.js';
import { renderCalendarEditor } from './calendar.js';
import { renderDatabaseEditor } from './database.js'; 
import { renderSecurityEditor } from './security.js'; 
import { renderHealthDashboard } from './health.js';  
import { renderDocumentation } from './docs.js';
import { renderUsersEditor } from './users.js';
import { renderWorkflowsEditor } from './workflows.js';

let currentConfig = null;
let currentFile = 'schema'; 
let currentItemKey = null;
let globalSchemaObj = null;

const itemListEl = document.getElementById('itemList');
const workspaceEl = document.getElementById('editorForm');
const btnSave = document.getElementById('btnSave');
const tabs = document.querySelectorAll('.admin-tab');

// Utility function to escape HTML strings safely against XSS
function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}

// Retrieve the CSRF token from the meta tag
function getCsrfToken() {
    const meta = document.querySelector('meta[name="csrf-token"]');
    return meta ? meta.getAttribute('content') : '';
}

document.addEventListener('DOMContentLoaded', async () => {
    initDashboardUI();
    await fetchGlobalSchema(); 
    loadConfigFile(currentFile);

    const debugToggle = document.getElementById('debugToggle');
    if (debugToggle) {
        debugToggle.checked = localStorage.getItem('sparrow_debug_mode') === 'true';
        debugToggle.addEventListener('change', (e) => {
            localStorage.setItem('sparrow_debug_mode', e.target.checked);
            if (!e.target.checked) {
                const dbg = document.getElementById('debug');
                if (dbg) dbg.style.display = 'none';
            }
        });
    }

    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            tabs.forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            currentFile = e.target.dataset.file;
            loadConfigFile(currentFile);
        });
    });

    document.getElementById('btnExport').addEventListener('click', () => {
        window.location.href = 'api.php?action=export';
    });

    const importBtn = document.getElementById('btnImport');
    const importInput = document.getElementById('importFileInput');
    
    importBtn.addEventListener('click', () => importInput.click());
    
    importInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const formData = new FormData();
        formData.append('backup_file', file);

        try {
            const res = await fetch('api.php?action=import', { 
                method: 'POST', 
                headers: { 'X-CSRF-Token': getCsrfToken() },
                body: formData 
            });
            const data = await res.json();
            if (data.status === 'success') {
                alert('Configuration imported successfully! Refreshing page...');
                window.location.reload();
            } else {
                alert('Import error: ' + (data.error || 'Unknown error'));
            }
        } catch (err) { alert('Failed to upload file.'); }
        importInput.value = '';
    });
});

async function fetchGlobalSchema() {
    try {
        const res = await fetch('api.php?action=get&file=schema');
        globalSchemaObj = await res.json();
    } catch (e) { console.warn("Could not load global schema"); }
}

function getTableOptions() {
    const options = [{ value: '', label: '-- Select Table --' }];
    if (globalSchemaObj && globalSchemaObj.tables) {
        for (const t in globalSchemaObj.tables) options.push({ value: t, label: globalSchemaObj.tables[t].display_name || t });
    }
    return options;
}

function getColumnOptionsForTable(tableName) {
    const options = [{ value: '', label: '-- Select Column --' }];
    if (tableName && globalSchemaObj && globalSchemaObj.tables[tableName] && globalSchemaObj.tables[tableName].columns) {
        const cols = globalSchemaObj.tables[tableName].columns;
        for (const c in cols) options.push({ value: c, label: cols[c].display_name || c });
    }
    return options;
}

async function loadConfigFile(fileName) {
    if (fileName === 'health' || fileName === 'docs' || fileName === 'users') {
        currentConfig = null;
        renderSidebar();
        renderEditor(fileName.toUpperCase(), null, false);
        return;
    }

    try {
        const response = await fetch(`api.php?action=get&file=${fileName}`);
        currentConfig = await response.json();

        if (fileName === 'schema') {
            if (!currentConfig.tables || Array.isArray(currentConfig.tables)) currentConfig.tables = {};
        } else if (fileName === 'dashboard') {
            if (!currentConfig.layout) currentConfig.layout = { columns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" };
            if (!currentConfig.widgets || !Array.isArray(currentConfig.widgets)) currentConfig.widgets = [];
            if (!currentConfig.menu_name) currentConfig.menu_name = 'Dashboard';
        } else if (fileName === 'calendar') {
            if (!currentConfig.sources || !Array.isArray(currentConfig.sources)) currentConfig.sources = [];
            if (!currentConfig.menu_name) currentConfig.menu_name = 'Calendar';
        } else if (fileName === 'workflows') {
            if (!currentConfig.workflows || !Array.isArray(currentConfig.workflows)) currentConfig.workflows = [];
            if (!currentConfig.menu_name) currentConfig.menu_name = 'Workflows';
        } else if (fileName === 'database') {
            if (!currentConfig.host) currentConfig = { host: 'localhost', port: '5432', dbname: '', user: 'postgres', password: '' };
        } else if (fileName === 'security') {
            if (!currentConfig.admin_password) currentConfig = { admin_password: 'admin' };
        }

        renderSidebar();
        workspaceEl.innerHTML = `<h2>Select an item from the left menu to edit</h2>`;
        
        if (fileName === 'database' || fileName === 'security') {
            renderEditor('SETTINGS', currentConfig, false);
        }
    } catch (err) { alert(`Failed to load ${fileName}.json`); }
}

function addNewItem() {
    let newIndex = 0;
    if (currentFile === 'dashboard') {
        currentConfig.widgets.push({ id: "widget_" + Date.now(), type: "kpi_card", title: "New Widget", table: "", query: { type: "count", column: "id" }, icon: "", color: "#3b82f6", display_columns: [] });
        newIndex = currentConfig.widgets.length - 1;
    } else if (currentFile === 'calendar') {
        currentConfig.sources.push({ table: "", date_column: "", title_column: "", color: "#3b82f6", notify_before_days: 0, user_id_column: "", url_template: "" });
        newIndex = currentConfig.sources.length - 1;
    } else if (currentFile === 'workflows') {
        currentConfig.workflows.push({ id: "wf_" + Date.now(), title: "New Workflow", icon: "", steps: [] });
        newIndex = currentConfig.workflows.length - 1;
    }
    
    currentItemKey = newIndex;
    renderSidebar();
    
    const items = currentFile === 'dashboard' ? currentConfig.widgets : currentFile === 'workflows' ? currentConfig.workflows : currentConfig.sources;
    renderEditor(newIndex, items[newIndex], true);
}

function clearConfig() {
    if (confirm(`Are you sure you want to completely clear the ${currentFile}.json configuration?`)) {
        if (currentFile === 'schema') currentConfig = { tables: {} };
        else if (currentFile === 'dashboard') currentConfig = { layout: { columns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }, widgets: [], menu_name: 'Dashboard' };
        else if (currentFile === 'calendar') currentConfig = { sources: [], menu_name: 'Calendar' };
        else if (currentFile === 'workflows') currentConfig = { workflows: [], menu_name: 'Workflows' };
        
        renderSidebar();
        workspaceEl.innerHTML = `<h2>Configuration cleared. Click "Save File" to apply!</h2>`;
    }
}

function renderSidebar() {
    itemListEl.innerHTML = '';
    
    if (currentFile === 'database' || currentFile === 'security' || currentFile === 'health' || currentFile === 'docs' || currentFile === 'users') {
        document.getElementById('sidebarTitle').textContent = currentFile.charAt(0).toUpperCase() + currentFile.slice(1);
        const actionDiv = document.getElementById('sidebarActions');
        if (actionDiv) actionDiv.innerHTML = ''; 

        const li = document.createElement('li');
        let title = "Settings";
        if (currentFile === 'health') title = "View Diagnostics";
        if (currentFile === 'docs') title = "Read Documentation";
        if (currentFile === 'users') title = "System Users";
        
        li.textContent = title; 
        li.style.fontWeight = 'bold'; 
        li.style.borderBottom = '2px solid var(--accent)';
        li.classList.add('active');
        itemListEl.appendChild(li);
        return; 
    }

    document.getElementById('sidebarTitle').textContent = currentFile === 'schema' ? 'Tables' : currentFile === 'dashboard' ? 'Widgets' : currentFile === 'workflows' ? 'Workflows' : 'Sources';
	
	// Remove existing button to prevent duplicates when sidebar re-renders
	const existingBtn = document.getElementById('addTableBtn');
	if (existingBtn) existingBtn.remove();

	// Append the button only if the active tab is 'schema'
	if (currentFile === 'schema') {
		const btnAddTable = createAddTableButton(currentConfig, 'app', (newTableName) => {
			alert('Table created successfully. Please click "Save File" to apply.');
			// Refresh sidebar to show the new table
			if (typeof renderSidebar === 'function') renderSidebar(); 
		}, (err) => {
			alert(err);
		});
		
		// Style and attach the button next to the title
		btnAddTable.id = 'addTableBtn';
		btnAddTable.style.fontSize = '12px';
		btnAddTable.style.float = 'right';
		sidebarTitle.appendChild(btnAddTable);
	}
    
    let actionDiv = document.getElementById('sidebarActions');
    if (!actionDiv) {
        actionDiv = document.createElement('div'); actionDiv.id = 'sidebarActions'; actionDiv.style.marginBottom = '15px';
        itemListEl.parentNode.insertBefore(actionDiv, itemListEl);
    }
    actionDiv.innerHTML = ''; 

    if (currentFile === 'schema') {
        const btnSync = document.createElement('button');
        btnSync.className = 'btn-add'; btnSync.style.width = '100%'; btnSync.innerHTML = 'Sync DB Tables';
        btnSync.onclick = () => {
            const schemaName = prompt("Enter database schema name to sync:", "public");
            if (schemaName) syncSchemaTables(currentConfig, schemaName, 
                (added) => { alert(`Added ${added} new tables!`); renderSidebar(); fetchGlobalSchema(); }, 
                (err) => alert(err));
        };
        actionDiv.appendChild(btnSync);
    } else {
        const btnAdd = document.createElement('button');
        btnAdd.className = 'btn-add'; btnAdd.style.width = '100%'; 
        btnAdd.innerHTML = currentFile === 'dashboard' ? '+ Add New Widget' : currentFile === 'workflows' ? '+ Add New Workflow' : '+ Add New Source';
        btnAdd.onclick = addNewItem;
        actionDiv.appendChild(btnAdd);
    }

    const btnClear = document.createElement('button');
    btnClear.className = 'btn-remove'; btnClear.style.width = '100%'; btnClear.style.marginTop = '10px'; btnClear.style.float = 'none';
    btnClear.innerHTML = 'Clear Entire Config'; btnClear.onclick = clearConfig;
    actionDiv.appendChild(btnClear);

    if (currentFile === 'dashboard' || currentFile === 'calendar' || currentFile === 'workflows') {
        const layoutLi = document.createElement('li');
        layoutLi.textContent = "Global Settings"; layoutLi.style.fontWeight = 'bold'; layoutLi.style.borderBottom = '2px solid var(--accent)';
        if (currentItemKey === 'LAYOUT') layoutLi.classList.add('active');
        layoutLi.onclick = () => {
            currentItemKey = 'LAYOUT';
            renderSidebar();
            renderEditor('LAYOUT', null, false);
        };
        itemListEl.appendChild(layoutLi);
    }

    if (!currentConfig) return;

    let itemsToIterate = currentFile === 'schema' ? (currentConfig.tables || {}) : currentFile === 'dashboard' ? (currentConfig.widgets || []) : currentFile === 'workflows' ? (currentConfig.workflows || []) : (currentConfig.sources || []);
    const isArray = Array.isArray(itemsToIterate);
    const keys = isArray ? itemsToIterate.map((_, i) => i) : Object.keys(itemsToIterate);

    keys.forEach((key, index) => {
        const item = itemsToIterate[key];
        const li = document.createElement('li');
        li.style.display = 'flex'; li.style.justifyContent = 'space-between'; li.style.alignItems = 'center';

        const textSpan = document.createElement('span');
        textSpan.textContent = currentFile === 'schema' ? (item.display_name || key) : currentFile === 'dashboard' ? (item.title || `Widget ${key}`) : currentFile === 'workflows' ? (item.title || `Workflow ${key}`) : (item.table || `Source ${key}`);
        li.appendChild(textSpan);

        const controls = document.createElement('div');
        const btnUp = document.createElement('button');
        btnUp.innerHTML = '^'; btnUp.style.cssText = 'background:none; border:none; cursor:pointer; font-size:14px; padding:0 2px;';
        if (index === 0) { btnUp.disabled = true; btnUp.style.opacity = '0.3'; btnUp.style.cursor = 'default'; }
        btnUp.onclick = (e) => {
            e.stopPropagation(); 
            if (isArray) {
                moveArrayItem(itemsToIterate, key, -1);
                if (currentItemKey === key) currentItemKey = key - 1; else if (currentItemKey === key - 1) currentItemKey = key;
            } else { currentConfig.tables = moveObjectKey(itemsToIterate, key, -1); }
            renderSidebar();
        };

        const btnDown = document.createElement('button');
        btnDown.innerHTML = 'v'; btnDown.style.cssText = 'background:none; border:none; cursor:pointer; font-size:14px; padding:0 2px;';
        if (index === keys.length - 1) { btnDown.disabled = true; btnDown.style.opacity = '0.3'; btnDown.style.cursor = 'default'; }
        btnDown.onclick = (e) => {
            e.stopPropagation();
            if (isArray) {
                moveArrayItem(itemsToIterate, key, 1);
                if (currentItemKey === key) currentItemKey = key + 1; else if (currentItemKey === key + 1) currentItemKey = key;
            } else { currentConfig.tables = moveObjectKey(itemsToIterate, key, 1); }
            renderSidebar();
        };

        controls.appendChild(btnUp); controls.appendChild(btnDown); li.appendChild(controls);

        if (String(currentItemKey) === String(key)) li.classList.add('active');

        li.onclick = () => { currentItemKey = key; renderSidebar(); renderEditor(key, item, isArray); };
        itemListEl.appendChild(li);
    });
}

function renderEditor(key, itemData, isArray) {
    workspaceEl.innerHTML = '';
    const ctx = { workspaceEl, currentConfig, getTableOptions, getColumnOptionsForTable, renderEditor, renderSidebar };
    
    // FIX: Show/hide save button based on currentFile instead of key
    if (['health', 'docs', 'users'].includes(currentFile)) {
        btnSave.style.display = 'none';
    } else {
        btnSave.style.display = 'inline-block';
    }

    if (currentFile === 'database') return renderDatabaseEditor(key, itemData, isArray, ctx);
    if (currentFile === 'security') return renderSecurityEditor(key, itemData, isArray, ctx);
    if (currentFile === 'health') return renderHealthDashboard(ctx);
    if (currentFile === 'docs') return renderDocumentation(ctx);
    if (currentFile === 'users') return renderUsersEditor(ctx);

    if (key === 'LAYOUT') {
        if (currentFile === 'dashboard') return renderDashboardLayout(ctx);
        if (currentFile === 'calendar') {
            workspaceEl.innerHTML = `<h3>Calendar Global Settings</h3>`;
            workspaceEl.appendChild(createTextInput('menu_name', 'Menu Display Name', currentConfig.menu_name || 'Calendar', v => currentConfig.menu_name = v));
            workspaceEl.appendChild(createIconPicker('menu_icon', 'Menu Icon', currentConfig.menu_icon || '', v => {
                if (v && v.trim() !== '') currentConfig.menu_icon = v; else delete currentConfig.menu_icon;
            }));
            return;
        }
        if (currentFile === 'workflows') {
            workspaceEl.innerHTML = `<h3>Workflows Global Settings</h3>`;
            workspaceEl.appendChild(createTextInput('menu_name', 'Menu Display Name', currentConfig.menu_name || 'Workflows', v => currentConfig.menu_name = v));
            workspaceEl.appendChild(createIconPicker('menu_icon', 'Menu Icon', currentConfig.menu_icon || '', v => {
                if (v && v.trim() !== '') currentConfig.menu_icon = v; else delete currentConfig.menu_icon;
            }));
            return;
        }
    }
    
    if (currentFile === 'schema') return renderSchemaEditor(key, itemData, ctx);

    const headerDiv = document.createElement('div');
    headerDiv.style.display = 'flex'; headerDiv.style.justifyContent = 'space-between'; headerDiv.style.alignItems = 'center';
    const title = document.createElement('h3'); 
    title.textContent = `Edit: ${isArray ? 'Item ' + key : key}`;
    headerDiv.appendChild(title);
    
    const btnDelete = document.createElement('button');
    btnDelete.className = 'btn-remove'; btnDelete.textContent = 'Delete this item';
    btnDelete.onclick = () => {
        if (confirm('Are you sure?')) {
            if (currentFile === 'dashboard') currentConfig.widgets.splice(key, 1);
            else if (currentFile === 'workflows') currentConfig.workflows.splice(key, 1);
            else currentConfig.sources.splice(key, 1);
            currentItemKey = null; 
            workspaceEl.innerHTML = '<h2>Item deleted. Save file to apply.</h2>';
            renderSidebar();
        }
    };
    headerDiv.appendChild(btnDelete);
    workspaceEl.appendChild(headerDiv);

    if (currentFile === 'dashboard') renderDashboardEditor(key, itemData, isArray, ctx);
    else if (currentFile === 'calendar') renderCalendarEditor(key, itemData, isArray, ctx);
    else if (currentFile === 'workflows') renderWorkflowsEditor(key, itemData, isArray, ctx);
}

btnSave.addEventListener('click', async () => {
    if (!currentConfig) return;
    try {
        const response = await fetch(`api.php?action=save&file=${currentFile}`, {
            method: 'POST', 
            headers: { 
                'Content-Type': 'application/json',
                'X-CSRF-Token': getCsrfToken()
            }, 
            body: JSON.stringify(currentConfig)
        });
        const result = await response.json();
        if (result.status === 'success') { alert(`${currentFile}.json saved!`); fetchGlobalSchema(); } 
        else alert('Error saving: ' + (result.error || 'Unknown error'));
    } catch (err) { alert('Failed to save changes.'); }
});