import { debugLog } from './debug.js';
import { onCellBlur, onInputChange, deleteRow, addRow, attachCellEvents } from './grid_actions.js';
import { setupPagination, getPageRows } from './pagination.js';
import { exportCSV } from './export_csv.js';

// Retrieve global user role with safe fallback
const userRole = window.USER_ROLE || 'readonly';
const isReadOnly = userRole === 'readonly';

const fkCache = {};

let currentTable = null;
let fullData = [];
let displayedColumns = [];
let filteredData = [];
let unsortedFilteredData = []; 
let sortState = { column: null, asc: true };

// Build dynamic menu from loaded schema
export function buildMenu(schema, menuEl, gridTitleEl, addRowBtn) {
    const ul = document.createElement('ul');
    
    const urlParams = new URLSearchParams(window.location.search);
    const urlTable = urlParams.get('table');
    const firstTable = Object.keys(schema.tables)[0];
    const initialTable = (urlTable && schema.tables[urlTable]) ? urlTable : firstTable;
  
    for (const [t, cfg] of Object.entries(schema.tables)) {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = '#';

        if (t === initialTable) {
            a.classList.add('active');
        }

        if (cfg.icon) {
            const img = document.createElement('img');
            img.src = cfg.icon;
            img.alt = '';
            a.appendChild(img);
        }

        const linkLabel = cfg.display_name || t;
        const textSpan = document.createElement('span');
        textSpan.className = 'menu-text'; // Added class for hiding text
        textSpan.textContent = linkLabel;
        a.appendChild(textSpan);

        // Expose label for tooltip in collapsed sidebar + screen readers
        a.title = linkLabel;
        a.setAttribute('aria-label', linkLabel);

        a.onclick = e => {
            e.preventDefault();
            menuEl.querySelectorAll('a').forEach(link => link.classList.remove('active'));
            a.classList.add('active');
            
            window.history.pushState({}, document.title, window.location.pathname);
            loadTable(schema, t, gridTitleEl, addRowBtn);
        };

        li.appendChild(a);
        ul.appendChild(li);
    }
  
    // Secure DOM clearing
    menuEl.replaceChildren();
    menuEl.appendChild(ul);
    debugLog("Menu built", Object.keys(schema.tables));
}

// Fetch and load table data
export async function loadTable(schema, table, gridTitleEl, addRowBtn) {
    debugLog("Loading table", table);

    try {
        const urlParams = new URLSearchParams(window.location.search);
        const filterCol = urlParams.get('filter_col');
        const filterVal = urlParams.get('filter_val');
        const filterWhere = urlParams.get('filter_where');

        let fetchUrl = `api.php?api=list&table=${encodeURIComponent(table)}`;

        if (urlParams.get('table') === table) {
            if (filterCol && filterVal !== null) {
                fetchUrl += `&filter_col=${encodeURIComponent(filterCol)}&filter_val=${encodeURIComponent(filterVal)}`;
            }
            if (filterWhere) {
                fetchUrl += `&filter_where=${encodeURIComponent(filterWhere)}`;
            }
        }

        const res = await fetch(fetchUrl, { headers: { 'X-Requested-With': 'XMLHttpRequest' }});
        const data = await res.json();

        currentTable = table;
        window.AppState = window.AppState || {};
        window.AppState.currentTable = currentTable;

        fullData = data.rows || [];
    
        displayedColumns = (data.columns || []).filter(c => {
            if (c === 'id') return false;
            const colCfg = schema.tables[table].columns[c] || {};
            if (colCfg.show_in_grid === false) return false;
            return true;
        });

        let displayTitle = data.table?.display_name || table;
        if (urlParams.get('table') === table && filterCol && filterVal !== null) {
            displayTitle += ` (Filtered by ${filterCol}: ${filterVal})`;
        }
        gridTitleEl.textContent = displayTitle;

        filteredData = fullData.slice();
        unsortedFilteredData = filteredData.slice(); 
        sortState = { column: null, asc: true };

        if (addRowBtn) {
            if (isReadOnly) {
                addRowBtn.style.display = 'none';
            } else {
                addRowBtn.style.display = '';
                addRowBtn.disabled = false;
                addRowBtn.onclick = () => {
                    window.location.href = `create.php?table=${currentTable}`;
                };
            }
        }

        await renderGrid(schema);
        document.dispatchEvent(new Event("tableLoaded"));
    } catch (err) {
        console.error("Failed to load table data:", err);
    }
}

// Preload foreign key relations securely
async function preloadForeignKeys(schema) {
    const fks = schema.tables[currentTable]?.foreign_keys;
    if (!fks) return;

    const fetchPromises = [];

    for (const col of displayedColumns) {
        const fkCfg = fks[col];
        if (fkCfg) {
            const cacheKey = `${currentTable}_${col}`;
            
            if (!fkCache[cacheKey]) {
                fkCache[cacheKey] = fetch(`api_fk.php?table=${encodeURIComponent(currentTable)}&col=${encodeURIComponent(col)}`, {
                    headers: { 'X-Requested-With': 'XMLHttpRequest' }
                })
                .then(res => res.json())
                .then(refData => refData.rows || [])
                .catch(err => {
                    console.error('Failed to fetch FK for column:', col, err);
                    return [];
                });
            }
            fetchPromises.push(fkCache[cacheKey]);
        }
    }

    await Promise.all(fetchPromises);
}

// Render the main data grid
export async function renderGrid(schema) {
    const gridEl = document.getElementById('grid');
    const table = document.createElement('table');

    await preloadForeignKeys(schema);

    const subtables = schema.tables[currentTable]?.subtables || [];
    const hasSubtables = subtables.length > 0;

    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');

    if (hasSubtables) {
        const thExpand = document.createElement('th');
        thExpand.style.width = '30px';
        headRow.appendChild(thExpand);
    }

    displayedColumns.forEach(col => {
        const th = document.createElement('th');
        const colCfg = schema.tables[currentTable].columns[col] || {};
        th.textContent = colCfg.display_name || col;
        th.dataset.col = col; 

        th.style.cursor = 'pointer';
        th.addEventListener('click', (e) => {
            if (e.target.classList.contains('col-resizer')) return;

            if (sortState.column === col) {
                if (sortState.asc === true) {
                    sortState.asc = false;
                } else {
                    sortState.column = null;
                    sortState.asc = true;
                }
            } else {
                sortState.column = col;
                sortState.asc = true;
            }

            filteredData = unsortedFilteredData.slice();
            if (sortState.column) sortData();
            renderGrid(schema);
        });

        if (sortState.column === col) {
            th.textContent += sortState.asc ? ' ↑' : ' ↓';
        }

        const resizer = document.createElement('div');
        resizer.className = 'col-resizer';
        th.appendChild(resizer);

        resizer.addEventListener('mousedown', (e) => {
            e.preventDefault(); 
            e.stopPropagation(); 
            
            const startX = e.pageX;
            const startWidth = th.offsetWidth;

            const onMouseMove = (moveEvent) => {
                const newWidth = startWidth + (moveEvent.pageX - startX);
                if (newWidth > 30) { 
                    th.style.width = `${newWidth}px`;
                    th.style.minWidth = `${newWidth}px`;
                    th.style.maxWidth = `${newWidth}px`;
                }
            };

            const onMouseUp = () => {
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            };

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });

        th.draggable = true;
        
        th.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', col);
            e.dataTransfer.effectAllowed = 'move';
            setTimeout(() => th.classList.add('dragging'), 0);
        });

        th.addEventListener('dragend', () => th.classList.remove('dragging'));

        th.addEventListener('dragover', (e) => {
            e.preventDefault(); 
            e.dataTransfer.dropEffect = 'move';
            th.classList.add('drag-over');
        });

        th.addEventListener('dragleave', () => th.classList.remove('drag-over'));

        th.addEventListener('drop', (e) => {
            e.preventDefault();
            th.classList.remove('drag-over');
            const draggedCol = e.dataTransfer.getData('text/plain');
            
            if (draggedCol && draggedCol !== col) {
                const fromIndex = displayedColumns.indexOf(draggedCol);
                const toIndex = displayedColumns.indexOf(col);
                
                if (fromIndex > -1 && toIndex > -1) {
                    displayedColumns.splice(fromIndex, 1);
                    displayedColumns.splice(toIndex, 0, draggedCol);
                    renderGrid(schema); 
                }
            }
        });

        headRow.appendChild(th);
    });

    if (!isReadOnly) {
        const thActions = document.createElement('th');
        thActions.textContent = 'Actions';
        headRow.appendChild(thActions);
    }
    
    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    const pageRows = getPageRows();

    for (const row of pageRows) {
        const tr = document.createElement('tr');

        if (hasSubtables) {
            const tdExpand = document.createElement('td');
            const btnExpand = document.createElement('button');
            btnExpand.textContent = '>';
            btnExpand.style.cssText = 'background:none; border:none; cursor:pointer; font-size:14px; color:var(--accent); font-weight:bold;';
            
            btnExpand.onclick = async () => {
                const nextTr = tr.nextElementSibling;
                if (nextTr && nextTr.classList.contains('drilldown-row')) {
                    nextTr.remove();
                    btnExpand.textContent = '>';
                } else {
                    btnExpand.textContent = 'v';
                    const ddTr = document.createElement('tr');
                    ddTr.className = 'drilldown-row';
                    const ddTd = document.createElement('td');
                    ddTd.colSpan = displayedColumns.length + (isReadOnly ? 1 : 2); 
                    
                    // Secure loading element creation
                    const loadingEl = document.createElement('em');
                    loadingEl.textContent = 'Loading...';
                    ddTd.appendChild(loadingEl);
                    
                    ddTr.appendChild(ddTd);
                    tr.after(ddTr);

                    ddTd.replaceChildren();
                    
                    for (const sub of subtables) {
                        const subWrapper = document.createElement('div');
                        subWrapper.className = 'drilldown-container';
                        subWrapper.style.marginBottom = '20px';
                        
                        const subTitle = document.createElement('h4');
                        subTitle.textContent = sub.label || sub.table;
                        subTitle.style.marginTop = '0';
                        subTitle.style.marginBottom = '10px';
                        subTitle.style.fontSize = '14px';
                        subTitle.style.color = 'var(--text)';
                        subWrapper.appendChild(subTitle);

                        try {
                            const res = await fetch(`api.php?api=list&table=${encodeURIComponent(sub.table)}&filter_col=${encodeURIComponent(sub.foreign_key)}&filter_val=${encodeURIComponent(row.id)}`, {
                                headers: { 'X-Requested-With': 'XMLHttpRequest' }
                            });
                            const data = await res.json();
                            
                            const ul = document.createElement('ul');
                            ul.className = 'drilldown-list';
                            
                            if (data.rows && data.rows.length > 0) {
                                const colsToShow = sub.columns_to_show && sub.columns_to_show.length ? sub.columns_to_show : ['id'];
                                
                                data.rows.forEach(r => {
                                    const li = document.createElement('li');
                                    
                                    const textSpan = document.createElement('span');
                                    const titleText = colsToShow.map(c => r[c + '__display'] ?? r[c] ?? '').join(' - ');
                                    textSpan.textContent = titleText || 'No title';
                                    
                                    const badge = document.createElement('span');
                                    badge.className = 'badge';
                                    badge.textContent = `id: ${r.id}`;

                                    li.appendChild(textSpan);
                                    li.appendChild(badge);
                                    
                                    li.addEventListener('click', () => {
                                         window.location.href = `edit.php?table=${sub.table}&id=${r.id}`;
                                    });

                                    ul.appendChild(li);
                                });
                            } else {
                                const noData = document.createElement('li');
                                noData.textContent = 'No related records.';
                                noData.style.justifyContent = 'center';
                                noData.style.color = 'var(--muted)';
                                ul.appendChild(noData);
                            }
                            subWrapper.appendChild(ul);
                        } catch(err) {
                            // Secure error element creation
                            const errP = document.createElement('p');
                            errP.style.color = 'var(--danger)';
                            errP.style.fontSize = '13px';
                            errP.textContent = 'Error fetching data.';
                            subWrapper.appendChild(errP);
                        }

                        ddTd.appendChild(subWrapper);
                    }
                }
            };
            tdExpand.appendChild(btnExpand);
            tr.appendChild(tdExpand);
        }

        for (const col of displayedColumns) {
            const colCfg = schema.tables[currentTable].columns[col] || {};
            const type = (colCfg.type || '').toLowerCase();
            let value = row[col + '__display'] ?? row[col] ?? '';

            const fkCfg = schema.tables[currentTable].foreign_keys?.[col];

            if (fkCfg) {
                const td = document.createElement('td');
                const input = document.createElement('input');
                
                input.type = 'search'; 
                
                const dlId = `fk_${currentTable}_${col}_${row['id']}`;
                
                input.setAttribute('list', dlId);
                input.dataset.column = col;
                input.dataset.id = row['id'];

                if (colCfg.readonly || isReadOnly) {
                    input.disabled = true;
                }

                const datalist = document.createElement('datalist');
                datalist.id = dlId;

                const dispCols = Array.isArray(fkCfg.display_column) ? fkCfg.display_column : [fkCfg.display_column || 'id'];
                const cacheKey = `${currentTable}_${col}`;
                let currentDisplay = "";

                if (fkCache[cacheKey]) {
                    const refData = await fkCache[cacheKey];
                    refData.forEach(r => {
                        const option = document.createElement('option');
                        const refCol = 'id'; 
                        const displayValue = dispCols.map(c => r[c + '__display'] ?? r[c] ?? '').join(' - ') || r[refCol];
                        
                        option.value = displayValue;
                        option.dataset.realId = r[refCol]; 

                        if (String(r[refCol]) === String(row[col])) {
                            currentDisplay = displayValue;
                        }

                        datalist.appendChild(option);
                    });
                }

                input.value = currentDisplay;

                input.addEventListener('focus', () => {
                    input.select();
                });

                input.addEventListener('blur', () => {
                    const isValid = Array.from(datalist.options).some(o => o.value === input.value);
                    
                    if (!isValid && input.value !== "") {
                        input.value = currentDisplay; 
                    } else if (isValid) {
                        currentDisplay = input.value;
                    }
                });

                if (!isReadOnly) attachCellEvents(input);
                td.appendChild(input);
                td.appendChild(datalist);
                tr.appendChild(td);
                continue;
            }

            const td = document.createElement('td');

            if (type === 'enum') {
                const select = document.createElement('select');
                select.dataset.column = col;
                select.dataset.id = row['id'];

                const applyEnumColor = (selectedValue) => {
                    if (colCfg.enum_colors && colCfg.enum_colors[selectedValue]) {
                        select.style.backgroundColor = colCfg.enum_colors[selectedValue];
                    } else {
                        select.style.backgroundColor = ''; 
                    }
                };

                const emptyOpt = document.createElement('option');
                emptyOpt.value = '';
                emptyOpt.textContent = '-- Select --';
                select.appendChild(emptyOpt);

                if (Array.isArray(colCfg.options)) {
                    colCfg.options.forEach(optVal => {
                        const opt = document.createElement('option');
                        opt.value = optVal;
                        opt.textContent = optVal;
                        if (optVal === value) {
                            opt.selected = true;
                        }
                        if (colCfg.enum_colors && colCfg.enum_colors[optVal]) {
                            opt.style.backgroundColor = colCfg.enum_colors[optVal];
                        }
                        select.appendChild(opt);
                    });
                }

                applyEnumColor(value);

                if (colCfg.readonly || isReadOnly) {
                    select.disabled = true;
                }

                select.addEventListener('change', (e) => applyEnumColor(e.target.value));
                if (!isReadOnly) attachCellEvents(select);
                td.appendChild(select);
            }
            else if (type.includes('boolean')) {
                const input = document.createElement('input');
                input.type = 'checkbox';
                input.checked = value === true || value === 't' || value === 'true';
                input.dataset.column = col;
                input.dataset.id = row['id'];

                if (colCfg.readonly || isReadOnly) input.disabled = true;
                if (!isReadOnly) attachCellEvents(input);
                td.appendChild(input);
            }
            else if (type.includes('date')) {
                const input = document.createElement('input');
                input.type = 'date';
                input.value = normalizeDateValue(value);
                input.dataset.column = col;
                input.dataset.id = row['id'];

                if (colCfg.readonly || isReadOnly) input.disabled = true;
                if (!isReadOnly) attachCellEvents(input);
                td.appendChild(input);
            }
            else {
                if (!colCfg.readonly && !isReadOnly) {
                    td.contentEditable = 'true';
                    td.classList.add('editable');
                }
                
                td.dataset.column = col;
                td.dataset.id = row['id'];

                if (colCfg.validation_regexp) {
                    td.dataset.pattern = colCfg.validation_regexp;
                    td.dataset.message = colCfg.validation_message || 'Invalid format';
                }
                
                const strVal = String(value).trim();
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                
                if (/^https?:\/\//i.test(strVal)) {
                    const a = document.createElement('a');
                    a.href = strVal;
                    a.target = '_blank';
                    a.textContent = strVal;
                    a.style.color = 'var(--accent)';
                    a.style.textDecoration = 'underline';
                    a.style.cursor = 'pointer';
                    
                    a.addEventListener('click', (e) => {
                        e.preventDefault();
                        window.open(strVal, '_blank');
                    });
                    td.appendChild(a);
                } 
                else if (emailRegex.test(strVal)) {
                    const a = document.createElement('a');
                    a.href = `mailto:${strVal}`;
                    a.textContent = strVal;
                    a.style.color = 'var(--accent)';
                    a.style.textDecoration = 'underline';
                    a.style.cursor = 'pointer';
                    
                    a.addEventListener('click', (e) => e.stopPropagation());
                    td.appendChild(a);
                } else {
    const searchInput = document.getElementById('globalSearch');
    const searchTerm = searchInput ? searchInput.value.trim() : '';

    if (searchTerm) {
        const escaped = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // ✅ fix
        const regex = new RegExp(`(${escaped})`, 'gi');

        const highlighted = String(value).replace(
            regex,
            '<mark class="search-highlight">$1</mark>'
        );

        td.innerHTML = highlighted;
    } else {
        td.textContent = value;
    }
}

                if (!isReadOnly) attachCellEvents(td);

                td.addEventListener('keydown', e => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        td.blur();
                    }
                });
                
                td.addEventListener('paste', e => {
                    e.preventDefault();
                    const text = (e.originalEvent || e).clipboardData.getData('text/plain');
                    document.execCommand('insertText', false, text);
                });
            }

            tr.appendChild(td);
        }

        if (!isReadOnly) {
            const tdActions = document.createElement('td');
            
            const editBtn = document.createElement('button');
            editBtn.textContent = 'Edit';
            editBtn.style.marginRight = '8px';
            editBtn.addEventListener('click', () => {
                window.location.href = `edit.php?table=${currentTable}&id=${row['id']}`;
            });
            tdActions.appendChild(editBtn);

            const delBtn = document.createElement('button');
            delBtn.textContent = 'Delete';
            delBtn.className = 'danger';

            delBtn.addEventListener('click', async () => {
                if (confirm("Are you sure you want to delete this record? This operation cannot be undone.")) {
                    const result = await deleteRow(row['id']);
                    if (result?.ok) {
                        fullData = fullData.filter(r => String(r.id) !== String(row['id']));
                        filteredData = filteredData.filter(r => String(r.id) !== String(row['id']));
                        unsortedFilteredData = unsortedFilteredData.filter(r => String(r.id) !== String(row['id']));
                        renderGrid(schema);
                    }
                }
            });

            tdActions.appendChild(delBtn);
            tr.appendChild(tdActions);
        }

        tbody.appendChild(tr);
    }

    table.appendChild(tbody);
    gridEl.replaceChildren();
    gridEl.appendChild(table);

    setupPagination(schema);
    debugLog("Grid rendered", { rows: pageRows.length });
}

// Custom client side sorting function
function sortData() {
    if (!sortState.column) return;
    const col = sortState.column;

    filteredData.sort((a, b) => {
        const valA = a[col + '__display'] ?? a[col] ?? '';
        const valB = b[col + '__display'] ?? b[col] ?? '';
        
        const isNumA = !isNaN(valA) && valA !== '';
        const isNumB = !isNaN(valB) && valB !== '';

        if (isNumA && isNumB) {
            const numA = Number(valA);
            const numB = Number(valB);
            return sortState.asc ? (numA - numB) : (numB - numA);
        }

        const strA = valA.toString().toLowerCase();
        const strB = valB.toString().toLowerCase();

        if (strA < strB) return sortState.asc ? -1 : 1;
        if (strA > strB) return sortState.asc ? 1 : -1;
        return 0;
    });
}

// Convert dates to standard format
function normalizeDateValue(value) {
    if (!value) return '';
    if (typeof value === 'string') {
        const dbMatch = value.match(/^(\d{4}-\d{2}-\d{2})/);
        if (dbMatch) return dbMatch[1];

        const iso = value.includes('T') ? value.split('T')[0] : value;
        const m = iso.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
        if (m) return `${m[3]}-${m[2]}-${m[1]}`;
        
        return iso;
    }
    return '';
}

// Return current grid state
export function getState() {
    return { currentTable, fullData, filteredData, displayedColumns, sortState };
}

// Update filtered dataset
export function setFilteredData(rows) {
    filteredData = rows;
    unsortedFilteredData = rows.slice();
    if (sortState.column) sortData();
}

// Reset filters
export async function resetFilters(schema) {
    filteredData = fullData.slice();
    unsortedFilteredData = fullData.slice();
    sortState = { column: null, asc: true };
    await renderGrid(schema);
}

// Setup export event listener
document.addEventListener('DOMContentLoaded', () => {
    // Search highlight trigger
    const searchInput = document.getElementById('globalSearch');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            renderGrid(window.schema); // or just renderGrid(schema) if needed
        });
    }

    // Existing export button logic
    const btn = document.getElementById('exportCsv');
    if (btn) btn.addEventListener('click', exportCSV);
});