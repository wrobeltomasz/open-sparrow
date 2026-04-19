// admin/schema.js
import { createTextInput, createSelectInput, createCheckbox, createColorInput, createIconPicker, moveObjectKey, createMenuPreview } from './ui.js';
import { showStatusPill, markDirty } from './app.js';

// Utility function to escape HTML strings safely against XSS
function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}

// Function to generate the Add Table button and handle its logic
export function createAddTableButton(currentConfig, defaultSchema, onSuccess, onError) {
    const btnAddTable = document.createElement('button');
    btnAddTable.type = 'button';
    btnAddTable.className = 'btn-add';
    btnAddTable.textContent = '+ Add Table';
    btnAddTable.style.background = '#10b981';
    btnAddTable.style.marginLeft = '10px';

    btnAddTable.onclick = async (e) => {
        e.preventDefault();

        const tableName = prompt('Enter new table name (lowercase, no spaces):');
        if (!tableName) return;

        // Force proper formatting
        const formattedName = tableName.toLowerCase().replace(/[^a-z0-9_]/g, '');

        // Prevent duplicates
        if (currentConfig.tables && currentConfig.tables[formattedName]) {
            onError('Table already exists in configuration.');
            return;
        }

        // Prompt user for schema name using the provided default
        const schemaInput = prompt('Enter database schema name:', defaultSchema || 'public');
        if (!schemaInput) return;
        
        // Format schema name safely
        const formattedSchema = schemaInput.toLowerCase().replace(/[^a-z0-9_]/g, '');

        try {
            const response = await fetch('api.php?action=create_table', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content
                },
                // Send formatted schema and table name
                body: JSON.stringify({ schema: formattedSchema, table: formattedName })
            });

            const result = await response.json();
            if (result.status === 'success') {
                if (!currentConfig.tables) currentConfig.tables = {};
                
                // Initialize basic table structure in memory with the chosen schema
                currentConfig.tables[formattedName] = {
                    display_name: formattedName.replace(/_/g, ' ').toUpperCase(),
                    schema: formattedSchema,
                    columns: {
                        id: { display_name: 'ID', type: 'integer', not_null: true }
                    }
                };
                onSuccess(formattedName);
            } else {
                onError(result.error || 'Failed to create table.');
            }
        } catch (err) {
            console.error(err);
            onError('Network error occurred.');
        }
    };

    return btnAddTable;
}

// Sync tables from database
// Uses POST with JSON body so that shared-hosting WAFs (ModSecurity / OWASP CRS)
// do not flag the request as SQL injection based on the query string.
export async function syncSchemaTables(currentConfig, schemaName, onSuccess, onError) {
    try {
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
        const res = await fetch('api.php?action=sync_schema', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': csrfToken
            },
            body: JSON.stringify({ schema_name: schemaName })
        });
        const data = await res.json();
        
        if (data.status === 'success') {
            let addedCount = 0;
            if (!currentConfig.tables || Array.isArray(currentConfig.tables)) currentConfig.tables = {};
            
            data.tables.forEach(tbl => {
                // Skip OpenSparrow system tables — they must never appear as user tables.
                if (tbl.startsWith('spw_')) return;
                if (!currentConfig.tables[tbl]) {
                    currentConfig.tables[tbl] = { display_name: tbl.replace(/_/g, ' ').toUpperCase(), schema: schemaName, columns: {} };
                    addedCount++;
                }
            });
            onSuccess(addedCount);
        } else {
            onError(data.error || 'Failed to sync tables.');
        }
    } catch (e) {
        console.error(e);
        onError('Error communicating with database.');
    }
}

// Render the schema editor UI
export function renderSchemaEditor(tableName, tableData, ctx) {
    const { workspaceEl, getTableOptions, renderEditor } = ctx;
    
    workspaceEl.innerHTML = '';

    // Create header with title and delete button
    const headerContainer = document.createElement('div');
    headerContainer.style.display = 'flex';
    headerContainer.style.justifyContent = 'space-between';
    headerContainer.style.alignItems = 'center';
    headerContainer.style.marginBottom = '20px';

    const titleEl = document.createElement('h3');
    titleEl.innerHTML = `Table Properties: ${escapeHtml(tableName)}`;
    titleEl.style.margin = '0';

    const btnDeleteTable = document.createElement('button');
    btnDeleteTable.type = 'button';
    btnDeleteTable.textContent = 'Delete Table';
    btnDeleteTable.style.cssText = 'background: #ef4444; color: white; border: none; padding: 6px 12px; cursor: pointer; font-weight: bold; border-radius: 4px;';
    btnDeleteTable.onclick = () => {
        if (confirm('Are you sure you want to remove this table from the configuration?')) {
            if (ctx.currentConfig && ctx.currentConfig.tables) {
                delete ctx.currentConfig.tables[tableName];
            }
            workspaceEl.innerHTML = '<h3 style="color: #ef4444;">Table removed from configuration. Please click "Save File" to apply changes.</h3>';
            
            markDirty();
            if (typeof ctx.renderSidebar === 'function') {
                ctx.renderSidebar();
            }
        }
    };

    headerContainer.appendChild(titleEl);
    headerContainer.appendChild(btnDeleteTable);
    workspaceEl.appendChild(headerContainer);

    if (!tableData.columns || Array.isArray(tableData.columns)) tableData.columns = {};
    if (!tableData.foreign_keys || Array.isArray(tableData.foreign_keys)) tableData.foreign_keys = {};
    if (!tableData.subtables || !Array.isArray(tableData.subtables)) tableData.subtables = [];

    const btnSyncCols = document.createElement('button');
    btnSyncCols.type = 'button';
    btnSyncCols.className = 'btn-add';
    btnSyncCols.style.background = '#007ACC';
    btnSyncCols.innerHTML = 'Sync Columns from DB';
    
    // Fetch and sync columns from database
    btnSyncCols.onclick = async () => {
        try {
            const schemaName = tableData.schema || 'public';
            // POST with JSON body — avoids WAF false positives on GET query strings.
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
            const res = await fetch('api.php?action=get_db_columns', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': csrfToken
                },
                body: JSON.stringify({ schema_name: schemaName, table: tableName })
            });

            const rawText = await res.text();

            if (!res.ok) {
                showStatusPill(btnSyncCols, `HTTP Error ${res.status}`, 'error');
                console.error('Sync columns HTTP error:', res.status, rawText);
                return;
            }

            let data;
            try {
                data = JSON.parse(rawText);
            } catch (parseErr) {
                showStatusPill(btnSyncCols, 'Server returned invalid JSON. Check console.', 'error');
                console.error('RAW RESPONSE:', rawText);
                return;
            }

            if (data.status === 'success') {
                let added = 0;
                data.columns.forEach(col => {
                    if (!tableData.columns[col.column_name]) {
                        
                        const isEnum = Array.isArray(col.enum_values);
                        const isNotNull = col.is_nullable === 'NO'; 
                        
                        // Extremely robust mapping catching different backend array keys
                        const rawType = String(col.data_type || col.type || col.udt_name || col.datatype || '').toLowerCase();
                        let mappedType = 'text';
                        
                        if (isEnum || rawType === 'user-defined' || rawType.includes('enum')) {
                            mappedType = 'enum';
                        } else if (/int|num|float|double|real|serial|dec/i.test(rawType)) {
                            mappedType = 'number';
                        } else if (/bool/i.test(rawType)) {
                            mappedType = 'boolean';
                        } else if (/date|time|timestamp/i.test(rawType)) {
                            mappedType = 'date';
                        }

                        // Make ID readonly by default
                        const isIdColumn = col.column_name.toLowerCase() === 'id';

                        tableData.columns[col.column_name] = {
                            display_name: col.column_name.replace(/_/g, ' ').toUpperCase(),
                            type: mappedType,
                            show_in_grid: true, 
                            show_in_edit: true, 
                            not_null: isNotNull,
                            readonly: isIdColumn
                        };
                        
                        if (isEnum) tableData.columns[col.column_name].options = col.enum_values;
                        added++;
                    }
                });
                if (added > 0) markDirty();
                showStatusPill(btnSyncCols, `Added ${added} new column${added === 1 ? '' : 's'}.`, added > 0 ? 'success' : 'info');
                renderEditor(tableName, tableData, false);
            } else {
                showStatusPill(btnSyncCols, 'API Error: ' + (data.error || 'Failed to sync columns.'), 'error');
            }
        } catch (err) {
            console.error(err);
            showStatusPill(btnSyncCols, 'Communication error. Check console.', 'error');
        }
    };
    workspaceEl.appendChild(btnSyncCols);

    // New code for dynamic column addition
    const btnAddCol = document.createElement('button');
    btnAddCol.type = 'button';
    btnAddCol.className = 'btn-add';
    btnAddCol.textContent = '+ Add Column';
    btnAddCol.style.background = '#3b82f6';
    btnAddCol.style.marginLeft = '10px';

    btnAddCol.onclick = async (e) => {
        e.preventDefault();

        const colName = prompt('Enter new column name (lowercase, no spaces):');
        if (!colName) return;

        // Force proper formatting
        const formattedColName = colName.toLowerCase().replace(/[^a-z0-9_]/g, '');

        // Prevent duplicates
        if (tableData.columns && tableData.columns[formattedColName]) {
            showStatusPill(btnAddCol, 'Column already exists.', 'error');
            return;
        }

        const colType = prompt('Enter data type (e.g., varchar(255), int4, boolean):', 'varchar(255)');
        if (!colType) return;

        try {
            const response = await fetch('api.php?action=add_column', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content
                },
                // Pass schema context accurately to backend
                body: JSON.stringify({ schema: tableData.schema || 'public', table: tableName, column: formattedColName, type: colType })
            });

            const result = await response.json();
            if (result.status === 'success') {
                tableData.columns[formattedColName] = {
                    display_name: formattedColName.replace(/_/g, ' ').charAt(0).toUpperCase() + formattedColName.replace(/_/g, ' ').slice(1),
                    type: 'text'
                };
                markDirty();
                renderEditor(tableName, tableData, false);
            } else {
                showStatusPill(btnAddCol, 'Error adding column: ' + result.error, 'error');
            }
        } catch (err) {
            console.error(err);
            showStatusPill(btnAddCol, 'Network error occurred.', 'error');
        }
    };
    workspaceEl.appendChild(btnAddCol);

    // Live FE sidebar preview — mirrors the menu entry produced by this table
    // in templates/menu.php so changes to display_name/icon/hidden are visible
    // immediately without saving.
    const preview = createMenuPreview();
    workspaceEl.appendChild(preview.el);
    const refreshPreview = () => preview.update({
        name: tableData.display_name || tableName,
        icon: tableData.icon || '',
        hidden: !!tableData.hidden,
    });
    refreshPreview();

    workspaceEl.appendChild(createTextInput('display_name', 'Display Name', tableData.display_name, (val) => {
        tableData.display_name = val;
        refreshPreview();
    }));
    workspaceEl.appendChild(createTextInput('schema', 'Database Schema', tableData.schema || 'app', (val) => tableData.schema = val));

    workspaceEl.appendChild(createIconPicker('icon', 'Icon Path', tableData.icon, (val) => {
        if (val) tableData.icon = val;
        else delete tableData.icon;
        refreshPreview();
    }));

    workspaceEl.appendChild(createCheckbox('hidden', 'Hide from Sidebar Menu', tableData.hidden, (val) => {
        tableData.hidden = val;
        refreshPreview();
    }, false));

    const colsTitle = document.createElement('h3');
    colsTitle.textContent = 'Columns Configuration';
    colsTitle.style.marginTop = '30px';
    workspaceEl.appendChild(colsTitle);

    // Standard field types allowed in the application
    const dataTypeOptions = [
        { value: 'text', label: 'Text' },
        { value: 'number', label: 'Number' },
        { value: 'boolean', label: 'Boolean' },
        { value: 'date', label: 'Date' },
        { value: 'enum', label: 'Enum' }
    ];

    const colKeys = Object.keys(tableData.columns);
    colKeys.forEach((colName, index) => {
        const colCfg = tableData.columns[colName];
        const block = document.createElement('div');
        block.className = 'column-block';
        
        const headerDiv = document.createElement('div');
        headerDiv.style.display = 'flex';
        headerDiv.style.justifyContent = 'space-between';
        headerDiv.style.alignItems = 'center';
        headerDiv.style.borderBottom = '1px solid #eee';
        headerDiv.style.paddingBottom = '5px';
        headerDiv.style.marginBottom = '15px';

        const h4 = document.createElement('h4');
        h4.textContent = `Column: ${colName}`;
        h4.style.margin = '0';
        h4.style.borderBottom = 'none';

        const moveControls = document.createElement('div');
        
        const btnUp = document.createElement('button');
        btnUp.type = 'button';
        btnUp.innerHTML = 'Up'; 
        btnUp.title = 'Move Up';
        btnUp.style.cssText = 'background:none; border:none; cursor:pointer; font-size:14px; margin-right:10px; text-decoration: underline;';
        if (index === 0) { btnUp.disabled = true; btnUp.style.opacity = '0.3'; btnUp.style.cursor = 'default'; }
        btnUp.onclick = () => {
            tableData.columns = moveObjectKey(tableData.columns, colName, -1);
            renderEditor(tableName, tableData, false);
        };

        const btnDown = document.createElement('button');
        btnDown.type = 'button';
        btnDown.innerHTML = 'Down'; 
        btnDown.title = 'Move Down';
        btnDown.style.cssText = 'background:none; border:none; cursor:pointer; font-size:14px; text-decoration: underline;';
        if (index === colKeys.length - 1) { btnDown.disabled = true; btnDown.style.opacity = '0.3'; btnDown.style.cursor = 'default'; }
        btnDown.onclick = () => {
            tableData.columns = moveObjectKey(tableData.columns, colName, 1);
            renderEditor(tableName, tableData, false);
        };

        moveControls.appendChild(btnUp);
        moveControls.appendChild(btnDown);
        headerDiv.appendChild(h4);
        headerDiv.appendChild(moveControls);
        block.appendChild(headerDiv);

        block.appendChild(createTextInput('display_name', 'Display Name', colCfg.display_name, (val) => colCfg.display_name = val));
        
        // Clean up any rogue legacy DB types just in case they slipped through earlier
        let currentType = String(colCfg.type || 'text').toLowerCase();
        if (!['text', 'number', 'boolean', 'date', 'enum'].includes(currentType)) {
            if (/int|num|float|double|real|serial|dec/i.test(currentType)) currentType = 'number';
            else if (/bool/i.test(currentType)) currentType = 'boolean';
            else if (/date|time|timestamp/i.test(currentType)) currentType = 'date';
            else currentType = 'text';
            colCfg.type = currentType;
        }

        // Dropdown instead of input field for clean type selection
        block.appendChild(createSelectInput('type', 'Data Type', dataTypeOptions, currentType, (val) => {
            colCfg.type = val;
            renderEditor(tableName, tableData, false); 
        }));
        
        const optsStr = colCfg.options ? colCfg.options.join(', ') : '';
        // Build this input inline (instead of createTextInput) so we can update
        // the model on every keystroke without re-rendering the whole editor —
        // the full re-render was stealing focus and resetting the scroll on
        // every keypress. Color pickers depend on colCfg.options, so the
        // re-render is deferred to the `change` event (fires on blur).
        const enumWrapper = document.createElement('div');
        enumWrapper.className = 'form-group';
        const enumLabel = document.createElement('label');
        enumLabel.textContent = 'Enum Options (Comma separated)';
        enumWrapper.appendChild(enumLabel);
        const enumInput = document.createElement('input');
        enumInput.type = 'text';
        enumInput.value = optsStr;

        const applyEnumValue = (val) => {
            if (val) {
                colCfg.options = val.split(',').map(s => s.trim()).filter(Boolean);
            } else {
                delete colCfg.options;
                delete colCfg.enum_colors;
            }
        };

        enumInput.addEventListener('input', (e) => {
            // Keep the in-memory config in sync so that clicking "Save File"
            // mid-typing does not lose the current value.
            applyEnumValue(e.target.value);
        });
        enumInput.addEventListener('change', (e) => {
            // Blur / Enter — now it is safe to re-render the editor so the
            // color-picker rows appear for the freshly entered options.
            applyEnumValue(e.target.value);
            renderEditor(tableName, tableData, false);
        });

        enumWrapper.appendChild(enumInput);
        block.appendChild(enumWrapper);

        const isTypeEnum = String(colCfg.type || '').toLowerCase() === 'enum';

        // Render color picker for ENUM types
        if (isTypeEnum && colCfg.options && colCfg.options.length > 0) {
            const colorsContainer = document.createElement('div');
            colorsContainer.style.marginLeft = '20px';
            colorsContainer.style.paddingLeft = '10px';
            colorsContainer.style.borderLeft = '2px solid #007ACC';
            colorsContainer.style.marginBottom = '15px';
            
            const colorsTitle = document.createElement('h5');
            colorsTitle.textContent = 'Enum Colors (Optional)';
            colorsTitle.style.marginTop = '0';
            colorsTitle.style.marginBottom = '10px';
            colorsContainer.appendChild(colorsTitle);

            if (!colCfg.enum_colors) colCfg.enum_colors = {};

            colCfg.options.forEach(optVal => {
                colorsContainer.appendChild(createColorInput(
                    `enum_color`,
                    `Color: ${optVal}`,
                    colCfg.enum_colors[optVal] || '#ffffff',
                    (val) => { colCfg.enum_colors[optVal] = val; }
                ));
            });
            block.appendChild(colorsContainer);
        }

        const fkData = tableData.foreign_keys[colName] || {};
        block.appendChild(createSelectInput('fk_ref', 'Foreign Key Reference Table', getTableOptions(), fkData.reference_table || '', (val) => {
            if (val) tableData.foreign_keys[colName] = { reference_table: val, reference_column: fkData.reference_column || 'id', display_column: fkData.display_column || ['name'] };
            else delete tableData.foreign_keys[colName];
            renderEditor(tableName, tableData, false); 
        }));

        // Render additional foreign key settings if referenced table is chosen
        if (tableData.foreign_keys[colName] && tableData.foreign_keys[colName].reference_table) {
            const fkContainer = document.createElement('div');
            fkContainer.style.marginLeft = '20px'; fkContainer.style.paddingLeft = '10px'; fkContainer.style.borderLeft = '2px solid var(--accent)'; fkContainer.style.marginBottom = '15px';
            fkContainer.appendChild(createTextInput('fk_ref_col', 'Reference Column (e.g., id)', tableData.foreign_keys[colName].reference_column, (val) => tableData.foreign_keys[colName].reference_column = val));
            
            const fkDispData = tableData.foreign_keys[colName].display_column;
            const fkDispStr = Array.isArray(fkDispData) ? fkDispData.join(', ') : (fkDispData || '');
            
            fkContainer.appendChild(createTextInput('fk_disp_col', 'Display Columns (Comma separated, e.g., first_name, last_name)', fkDispStr, (val) => {
                if(val) {
                    tableData.foreign_keys[colName].display_column = val.split(',').map(s => s.trim()).filter(s => s !== '');
                } else {
                    tableData.foreign_keys[colName].display_column = [];
                }
            }));
            
            block.appendChild(fkContainer);
        }

        // New feature: Validation Regex and Message configuration block
        const regexContainer = document.createElement('div');
        regexContainer.style.marginLeft = '20px'; 
        regexContainer.style.paddingLeft = '10px'; 
        regexContainer.style.borderLeft = '2px solid #8b5cf6'; 
        regexContainer.style.marginBottom = '15px';

        const regexTitle = document.createElement('h5');
        regexTitle.textContent = 'Validation Rules (Optional)';
        regexTitle.style.marginTop = '0';
        regexTitle.style.marginBottom = '10px';
        regexContainer.appendChild(regexTitle);

        regexContainer.appendChild(createTextInput(
            'validation_regexp', 
            'RegExp Pattern (e.g., ^[A-Z]{2}\\d{4}$)', 
            colCfg.validation_regexp || '', 
            (val) => { 
                if (val) colCfg.validation_regexp = val; 
                else delete colCfg.validation_regexp; 
            }
        ));

        regexContainer.appendChild(createTextInput(
            'validation_message', 
            'Error Message (e.g., Invalid code format)', 
            colCfg.validation_message || '', 
            (val) => { 
                if (val) colCfg.validation_message = val; 
                else delete colCfg.validation_message; 
            }
        ));

        block.appendChild(regexContainer);
        
        block.appendChild(createCheckbox('show_in_grid', 'Show in Grid', colCfg.show_in_grid, (val) => colCfg.show_in_grid = val, true));
        block.appendChild(createCheckbox('show_in_edit', 'Show in Edit Form', colCfg.show_in_edit, (val) => colCfg.show_in_edit = val, true));
        block.appendChild(createCheckbox('not_null', 'Is Required (Not Null)', colCfg.not_null, (val) => colCfg.not_null = val, false));
        block.appendChild(createCheckbox('readonly', 'Read Only', colCfg.readonly, (val) => colCfg.readonly = val, false));
        
        workspaceEl.appendChild(block);
    });

    const subTitle = document.createElement('h3');
    subTitle.textContent = 'Subtables Configuration (Has Many Relationships)';
    subTitle.style.marginTop = '40px';
    workspaceEl.appendChild(subTitle);

    const subContainer = document.createElement('div');
    workspaceEl.appendChild(subContainer);

    // Render configuration for subtables
    const renderSubtables = () => {
        subContainer.innerHTML = '';
        tableData.subtables.forEach((subCfg, index) => {
            const block = document.createElement('div');
            block.className = 'column-block';
            block.style.borderLeft = '4px solid #4CAF50'; 

            const headerDiv = document.createElement('div');
            headerDiv.style.display = 'flex';
            headerDiv.style.justifyContent = 'space-between';
            headerDiv.style.marginBottom = '15px';
            
            const h4 = document.createElement('h4');
            h4.textContent = `Subtable #${index + 1}`;
            h4.style.margin = '0';
            
            const btnDel = document.createElement('button');
            btnDel.type = 'button';
            btnDel.textContent = 'Delete';
            btnDel.style.cssText = 'background:none; border:none; color:red; cursor:pointer; font-weight:bold; text-decoration: underline;';
            btnDel.onclick = () => {
                tableData.subtables.splice(index, 1);
                renderSubtables();
            };

            headerDiv.appendChild(h4);
            headerDiv.appendChild(btnDel);
            block.appendChild(headerDiv);

            block.appendChild(createSelectInput('sub_table', 'Child Table (Target)', getTableOptions(), subCfg.table || '', (val) => subCfg.table = val));
            block.appendChild(createTextInput('sub_fk', 'Foreign Key Column in Child Table', subCfg.foreign_key, (val) => subCfg.foreign_key = val));
            block.appendChild(createTextInput('sub_label', 'Display Label', subCfg.label, (val) => subCfg.label = val));
            
            const colsStr = subCfg.columns_to_show ? subCfg.columns_to_show.join(', ') : '';
            block.appendChild(createTextInput('sub_cols', 'Columns to Show (Comma separated)', colsStr, (val) => {
                if(val) {
                    subCfg.columns_to_show = val.split(',').map(s => s.trim()).filter(s => s !== ''); 
                } else {
                    subCfg.columns_to_show = [];
                }
            }));

            subContainer.appendChild(block);
        });

        const btnAddSub = document.createElement('button');
        btnAddSub.type = 'button';
        btnAddSub.className = 'btn-add';
        btnAddSub.style.background = '#4CAF50';
        btnAddSub.textContent = '+ Add Subtable';
        btnAddSub.onclick = () => {
            tableData.subtables.push({ table: '', foreign_key: '', label: '', columns_to_show: ['id'] });
            renderSubtables();
        };
        subContainer.appendChild(btnAddSub);
    };

    renderSubtables();
}