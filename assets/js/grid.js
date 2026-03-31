import { debugLog } from './debug.js';
import { onCellBlur, onInputChange, deleteRow, addRow, attachCellEvents } from './grid_actions.js';
import { setupPagination, getPageRows } from './pagination.js';
import { exportCSV } from './export_csv.js';

const fkCache = {};

let currentTable = null;
let fullData = [];
let displayedColumns = [];
let filteredData = [];
let sortState = { column: null, asc: true };

// Build dynamic menu from schema
export function buildMenu(schema, menuEl, gridTitleEl, addRowBtn) {
  const ul = document.createElement('ul');
  
  for (const [t, cfg] of Object.entries(schema.tables)) {
    if (cfg.hidden === true) {
        continue;
    }

    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = '#';

    // Append icon if it exists
    if (cfg.icon) {
      const img = document.createElement('img');
      img.src = cfg.icon;
      img.alt = '';
      a.appendChild(img);
    }

    const textSpan = document.createElement('span');
    textSpan.textContent = cfg.display_name || t;
    a.appendChild(textSpan);

    // Handle menu item click
    a.onclick = e => {
      e.preventDefault();
      menuEl.querySelectorAll('a').forEach(link => link.classList.remove('active'));
      a.classList.add('active');
      loadTable(schema, t, gridTitleEl, addRowBtn);
    };

    li.appendChild(a);
    ul.appendChild(li);
  }
  
  menuEl.innerHTML = '';
  menuEl.appendChild(ul);
  debugLog("Menu built", Object.keys(schema.tables));
}

// Fetch and load table data
export async function loadTable(schema, table, gridTitleEl, addRowBtn) {
  debugLog("Loading table", table);

  try {
    const res = await fetch(`index.php?api=list&table=${encodeURIComponent(table)}`);
    const data = await res.json();

    currentTable = table;
    window.AppState = window.AppState || {};
    window.AppState.currentTable = currentTable;

    fullData = data.rows || [];
    
    // Filter out hidden columns and PK
    displayedColumns = (data.columns || []).filter(c => {
      if (c === 'id') return false;
      const colCfg = schema.tables[table].columns[c] || {};
      if (colCfg.show_in_grid === false) return false;
      return true;
    });

    gridTitleEl.textContent = data.table?.display_name || table;
    filteredData = fullData.slice();
    addRowBtn.disabled = false;
    sortState = { column: null, asc: true };

    // Redirect to create form on button click
    addRowBtn.onclick = () => {
      debugLog("Redirect to create form", { table: currentTable });
      window.location.href = `create.php?table=${currentTable}`;
    };

    await renderGrid(schema);

    // Dispatch event to re-init filters
    document.dispatchEvent(new Event("tableLoaded"));
  } catch (err) {
    console.error("Failed to load table data:", err);
  }
}

// Preload foreign key relations
async function preloadForeignKeys(schema) {
  const fks = schema.tables[currentTable]?.foreign_keys;
  if (!fks) return;

  const fetchPromises = [];

  for (const col of displayedColumns) {
    const fkCfg = fks[col];
    if (fkCfg) {
      const refTable = fkCfg.reference_table;
      
      // Fetch related data if not cached
      if (!fkCache[refTable]) {
        fkCache[refTable] = fetch(`index.php?api=list&table=${encodeURIComponent(refTable)}`)
          .then(res => res.json())
          .then(refData => refData.rows || [])
          .catch(err => {
            console.error(`Failed to fetch FK for ${refTable}`, err);
            return [];
          });
      }
      
      fetchPromises.push(fkCache[refTable]);
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

  // Add expand column for subtables
  if (hasSubtables) {
    const thExpand = document.createElement('th');
    thExpand.style.width = '30px';
    headRow.appendChild(thExpand);
  }

  // Create table headers
  displayedColumns.forEach(col => {
    const th = document.createElement('th');
    const colCfg = schema.tables[currentTable].columns[col] || {};
    th.textContent = colCfg.display_name || col;

    th.style.cursor = 'pointer';
    th.addEventListener('click', () => {
      if (sortState.column === col) {
        sortState.asc = !sortState.asc;
      } else {
        sortState.column = col;
        sortState.asc = true;
      }
      sortData();
      renderGrid(schema);
    });

    // Add sort indicator
    if (sortState.column === col) {
      th.textContent += sortState.asc ? ' (Asc)' : ' (Desc)';
    }

    headRow.appendChild(th);
  });

  const thActions = document.createElement('th');
  thActions.textContent = 'Actions';
  headRow.appendChild(thActions);
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  const pageRows = getPageRows();

  for (const row of pageRows) {
    const tr = document.createElement('tr');

    // Handle subtable drilldown
    if (hasSubtables) {
      const tdExpand = document.createElement('td');
      const btnExpand = document.createElement('button');
      btnExpand.textContent = '▶';
      btnExpand.style.cssText = 'background:none; border:none; cursor:pointer; font-size:14px; color:var(--accent); font-weight:bold;';
      
      btnExpand.onclick = async () => {
        const nextTr = tr.nextElementSibling;
        if (nextTr && nextTr.classList.contains('drilldown-row')) {
          nextTr.remove();
          btnExpand.textContent = '▶';
        } else {
          btnExpand.textContent = '▼';
          const ddTr = document.createElement('tr');
          ddTr.className = 'drilldown-row';
          const ddTd = document.createElement('td');
          ddTd.colSpan = displayedColumns.length + 2; 
          ddTd.innerHTML = '<em>Loading...</em>';
          ddTr.appendChild(ddTd);
          tr.after(ddTr);

          ddTd.innerHTML = '';
          
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

            // Fetch related subtable rows
            try {
              const res = await fetch(`index.php?api=list&table=${encodeURIComponent(sub.table)}&filter_col=${encodeURIComponent(sub.foreign_key)}&filter_val=${encodeURIComponent(row.id)}`);
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
              subWrapper.innerHTML += '<p style="color:var(--danger); font-size:13px;">Error fetching data.</p>';
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

      // Handle Foreign Key rendering with datalist for searchability
      if (fkCfg) {
        const td = document.createElement('td');
        const input = document.createElement('input');
        
        // Use type search to add native clear button (X) in browsers
        input.type = 'search'; 
        
        const dlId = `fk_${currentTable}_${col}_${row['id']}`;
        
        input.setAttribute('list', dlId);
        input.dataset.column = col;
        input.dataset.id = row['id'];

        if (colCfg.readonly) {
            input.disabled = true;
        }

        const datalist = document.createElement('datalist');
        datalist.id = dlId;

        const refTable = fkCfg.reference_table;
        const refCol = fkCfg.reference_column || 'id';
        
        // Safely parse display_column to array
        const dispCols = Array.isArray(fkCfg.display_column) ? fkCfg.display_column : [fkCfg.display_column || 'id'];

        let currentDisplay = "";

        if (fkCache[refTable]) {
          const refData = await fkCache[refTable];
          refData.forEach(r => {
            const option = document.createElement('option');
            const displayValue = dispCols.map(c => r[c + '__display'] ?? r[c] ?? '').join(' - ') || r[refCol];
            
            option.value = displayValue;
            
            // Hide the real database ID in a hidden data attribute
            option.dataset.realId = r[refCol]; 

            if (String(r[refCol]) === String(row[col])) {
              currentDisplay = displayValue;
            }

            datalist.appendChild(option);
          });
        }

        input.value = currentDisplay;

        // Select all text on click/focus so typing immediately overrides it
        input.addEventListener('focus', () => {
            input.select();
        });

        // Revert to the last valid name upon leaving the cell to prevent confusion
        input.addEventListener('blur', () => {
          const isValid = Array.from(datalist.options).some(o => o.value === input.value);
          
          if (!isValid && input.value !== "") {
            input.value = currentDisplay; 
          } else if (isValid) {
            currentDisplay = input.value;
          }
        });

        attachCellEvents(input);
        td.appendChild(input);
        td.appendChild(datalist);
        tr.appendChild(td);
        continue;
      }

      const td = document.createElement('td');

      // Render enum as dropdown
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

        if (colCfg.readonly) {
            select.disabled = true;
        }

        select.addEventListener('change', (e) => {
            applyEnumColor(e.target.value);
        });

        attachCellEvents(select);
        td.appendChild(select);
      }
      // Render boolean as checkbox
      else if (type.includes('boolean')) {
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.checked = value === true || value === 't' || value === 'true';
        input.dataset.column = col;
        input.dataset.id = row['id'];

        if (colCfg.readonly) {
            input.disabled = true;
        }

        attachCellEvents(input);
        td.appendChild(input);
      }
      // Render date picker
      else if (type.includes('date')) {
        const input = document.createElement('input');
        input.type = 'date';
        input.value = normalizeDateValue(value);
        input.dataset.column = col;
        input.dataset.id = row['id'];

        if (colCfg.readonly) {
            input.disabled = true;
        }

        attachCellEvents(input);
        td.appendChild(input);
      }
      // Render editable text cell
      else {
        if (!colCfg.readonly) {
            td.contentEditable = 'true';
            td.classList.add('editable');
        }
        
        td.dataset.column = col;
        td.dataset.id = row['id'];
        
        const strVal = String(value).trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        // Handle URL links
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
        // Handle email links
        else if (emailRegex.test(strVal)) {
            const a = document.createElement('a');
            a.href = `mailto:${strVal}`;
            a.textContent = strVal;
            a.style.color = 'var(--accent)';
            a.style.textDecoration = 'underline';
            a.style.cursor = 'pointer';
            
            a.addEventListener('click', (e) => {
                e.stopPropagation();
            });

            td.appendChild(a);
        } else {
            td.textContent = value;
        }

        attachCellEvents(td);

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

    const tdActions = document.createElement('td');
    
    // Edit action button
    const editBtn = document.createElement('button');
    editBtn.textContent = 'Edit';
    editBtn.style.marginRight = '8px';
    editBtn.addEventListener('click', () => {
      window.location.href = `edit.php?table=${currentTable}&id=${row['id']}`;
    });
    tdActions.appendChild(editBtn);

    // Delete action button
    const delBtn = document.createElement('button');
    delBtn.textContent = 'Delete';
    delBtn.className = 'danger';

    delBtn.addEventListener('click', async () => {
      if (confirm("Are you sure you want to delete this record? This operation cannot be undone.")) {
        const result = await deleteRow(row['id']);
        if (result?.ok) {
          fullData = fullData.filter(r => String(r.id) !== String(row['id']));
          filteredData = filteredData.filter(r => String(r.id) !== String(row['id']));
          renderGrid(schema);
        }
      }
    });

    tdActions.appendChild(delBtn);
    tr.appendChild(tdActions);

    tbody.appendChild(tr);
  }

  table.appendChild(tbody);
  gridEl.innerHTML = '';
  gridEl.appendChild(table);

  setupPagination(schema);

  debugLog("Grid rendered", { rows: pageRows.length });
}

// Custom client-side sorting function
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

// Convert dates to standard ISO format for input fields
function normalizeDateValue(value) {
  if (!value) return '';
  if (typeof value === 'string') {
    const dbMatch = value.match(/^(\d{4}-\d{2}-\d{2})/);
    if (dbMatch) {
      return dbMatch[1];
    }

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
}

// Reset filtered data to full dataset and re-render
export async function resetFilters(schema) {
  filteredData = fullData.slice();
  sortState = { column: null, asc: true };
  await renderGrid(schema);
}

// Initialize export button event listener
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('exportCsv');
  if (btn) {
    btn.addEventListener('click', exportCSV);
  } else {
    console.error("Export CSV button not found");
  }
});