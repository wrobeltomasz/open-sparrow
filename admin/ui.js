// admin/ui.js

export const helpTexts = {
    display_name: "The name that will be shown to users in the interface.",
    icon: "Path to the icon image (e.g., assets/icons/my_icon.png) or emoji.",
    hidden: "If checked, this table will not be displayed in the main application's sidebar menu.",
    type: "Database data type (e.g., String(255), integer, boolean, date).",
    fk_ref: "Select a related table. If selected, specify the Reference Column (usually 'id') and Display Column (what users see).",
    url_template: "Template for the link when an event is clicked (e.g., edit.php?table=tasks&id={id}).",
    display_columns: "For 'list' widget type only: A comma-separated list of database columns to display in each row.",
    notified_users: "Select specific active users who will receive notifications." // Added help text for users
};

export function moveArrayItem(arr, index, direction) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= arr.length) return false;
    const item = arr.splice(index, 1)[0];
    arr.splice(newIndex, 0, item);
    return true;
}

export function moveObjectKey(obj, key, direction) {
    const keys = Object.keys(obj);
    const index = keys.indexOf(key);
    if (index < 0) return obj;
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= keys.length) return obj;

    const temp = keys[newIndex];
    keys[newIndex] = keys[index];
    keys[index] = temp;

    const newObj = {};
    keys.forEach(k => newObj[k] = obj[k]);
    return newObj;
}

export function createTextInput(key, labelText, value, onChange) {
    const wrapper = document.createElement('div');
    wrapper.className = 'form-group';
    const label = document.createElement('label');
    label.textContent = labelText;
    wrapper.appendChild(label);
    const input = document.createElement('input');
    input.type = 'text';
    input.value = value || '';
    input.addEventListener('input', (e) => onChange(e.target.value));
    wrapper.appendChild(input);
    if (helpTexts[key]) {
        const help = document.createElement('span');
        help.className = 'help-text';
        help.textContent = helpTexts[key];
        wrapper.appendChild(help);
    }
    return wrapper;
}

export function createDatalistInput(key, labelText, listId, value, onChange) {
    const wrapper = document.createElement('div');
    wrapper.className = 'form-group';
    const label = document.createElement('label');
    label.textContent = labelText;
    wrapper.appendChild(label);
    const input = document.createElement('input');
    input.type = 'text';
    input.setAttribute('list', listId); 
    input.value = value || '';
    input.addEventListener('input', (e) => onChange(e.target.value));
    wrapper.appendChild(input);
    return wrapper;
}

export function createIconPicker(key, labelText, value, onChange) {
    const wrapper = document.createElement('div');
    wrapper.className = 'form-group';
    
    const label = document.createElement('label');
    label.textContent = labelText;
    wrapper.appendChild(label);

    const inputGroup = document.createElement('div');
    inputGroup.style.display = 'flex';
    inputGroup.style.gap = '10px';

    const input = document.createElement('input');
    input.type = 'text';
    input.value = value || '';
    input.style.flex = '1';
    input.addEventListener('input', (e) => onChange(e.target.value));

    const btn = document.createElement('button');
    btn.textContent = '🖼️ Przeglądaj';
    btn.type = 'button';
    btn.className = 'btn-add';
    btn.style.margin = '0';
    btn.style.padding = '0 15px';
    btn.onclick = async () => {
        const modal = document.createElement('div');
        modal.style.cssText = `position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); display:flex; justify-content:center; align-items:center; z-index:10000;`;
        
        const content = document.createElement('div');
        content.style.cssText = `background:#fff; padding:20px; border-radius:8px; width:90%; max-width:600px; max-height:80vh; overflow-y:auto; position:relative; box-shadow: 0 4px 15px rgba(0,0,0,0.2);`;
        
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '✖ Zamknij';
        closeBtn.style.cssText = `position:absolute; top:15px; right:15px; background:#dc2626; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;`;
        closeBtn.onclick = () => modal.remove();
        content.appendChild(closeBtn);
        
        content.innerHTML += '<h3 style="margin-top:0;">Wybierz Ikonę</h3><p style="color:#777; font-size:13px;">Ikony pobierane są z <code>assets/icons/</code> oraz <code>assets/img/</code>.</p>';
        
        const grid = document.createElement('div');
        grid.style.cssText = `display:grid; grid-template-columns:repeat(auto-fill, minmax(70px, 1fr)); gap:15px; margin-top:20px;`;
        
        try {
            const res = await fetch('api.php?action=list_icons');
            const data = await res.json();
            if (data.status === 'success' && data.icons.length > 0) {
                data.icons.forEach(iconPath => {
                    const imgBox = document.createElement('div');
                    imgBox.style.cssText = `cursor:pointer; text-align:center; padding:10px; border:1px solid #ddd; border-radius:6px; transition:0.2s; display:flex; align-items:center; justify-content:center; height: 70px;`;
                    imgBox.onmouseover = () => { imgBox.style.borderColor = '#007ACC'; imgBox.style.background = '#f0f8ff'; };
                    imgBox.onmouseout = () => { imgBox.style.borderColor = '#ddd'; imgBox.style.background = 'transparent'; };
                    
                    const img = document.createElement('img');
                    img.src = '../' + iconPath; 
                    img.style.maxWidth = '100%';
                    img.style.maxHeight = '100%';
                    img.style.objectFit = 'contain';
                    
                    imgBox.appendChild(img);
                    imgBox.onclick = () => {
                        input.value = iconPath;
                        onChange(iconPath);
                        modal.remove();
                    };
                    grid.appendChild(imgBox);
                });
            } else {
                grid.innerHTML = '<p style="grid-column: 1 / -1; color:#777;">Brak ikon. Utwórz folder <code>assets/icons/</code> w głównym katalogu i wrzuć tam pliki (PNG, SVG, JPG).</p>';
            }
        } catch(e) {
            grid.innerHTML = '<p style="color:red; grid-column: 1 / -1;">Wystąpił błąd podczas ładowania ikon.</p>';
        }
        
        content.appendChild(grid);
        modal.appendChild(content);
        document.body.appendChild(modal);
    };

    inputGroup.appendChild(input);
    inputGroup.appendChild(btn);
    wrapper.appendChild(inputGroup);

    if (helpTexts[key]) {
        const help = document.createElement('span');
        help.className = 'help-text';
        help.textContent = helpTexts[key];
        wrapper.appendChild(help);
    }
    return wrapper;
}

export function createSelectInput(key, labelText, options, value, onChange) {
    const wrapper = document.createElement('div');
    wrapper.className = 'form-group';
    const label = document.createElement('label');
    label.textContent = labelText;
    wrapper.appendChild(label);
    const select = document.createElement('select');
    options.forEach(opt => {
        const o = document.createElement('option');
        o.value = opt.value;
        o.textContent = opt.label;
        if (opt.value === value) o.selected = true;
        select.appendChild(o);
    });
    select.addEventListener('change', (e) => onChange(e.target.value));
    wrapper.appendChild(select);
    return wrapper;
}

export function createColorInput(key, labelText, value, onChange) {
    const wrapper = document.createElement('div');
    wrapper.className = 'form-group';
    const label = document.createElement('label');
    label.textContent = labelText;
    wrapper.appendChild(label);
    const input = document.createElement('input');
    input.type = 'color';
    input.value = value || '#007ACC'; 
    input.addEventListener('input', (e) => onChange(e.target.value));
    wrapper.appendChild(input);
    return wrapper;
}

export function createCheckbox(key, labelText, value, onChange, defaultValue = true) {
    const wrapper = document.createElement('div');
    wrapper.className = 'form-group';
    wrapper.style.display = 'flex';
    wrapper.style.alignItems = 'center';
    
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = (value !== undefined && value !== null) ? value : defaultValue;
    if (value === undefined || value === null) onChange(defaultValue);
    input.addEventListener('change', (e) => onChange(e.target.checked));
    
    const label = document.createElement('label');
    label.textContent = labelText;
    label.style.marginBottom = '0';
    label.style.cursor = 'pointer';
    label.onclick = () => input.click();
    
    wrapper.appendChild(input);
    wrapper.appendChild(label);
    
    const container = document.createElement('div');
    container.style.marginBottom = '15px';
    container.appendChild(wrapper);
    return container;
}

// New function to handle multiple choices via checkboxes list
export function createMultiSelect(key, labelText, options, selectedValues, onChange) {
    const wrapper = document.createElement('div');
    wrapper.className = 'form-group';
    
    const label = document.createElement('label');
    label.textContent = labelText;
    wrapper.appendChild(label);

    const container = document.createElement('div');
    container.style.cssText = 'max-height: 150px; overflow-y: auto; border: 1px solid #cbd5e1; padding: 10px; border-radius: 4px; background: #fff;';

    const safeValues = Array.isArray(selectedValues) ? [...selectedValues] : [];

    if (options.length === 0) {
        container.innerHTML = '<span style="color:#777; font-size:13px;">No options available</span>';
    } else {
        options.forEach(opt => {
            const lbl = document.createElement('label');
            lbl.style.cssText = 'display: flex; align-items: center; margin-bottom: 5px; cursor: pointer; font-weight: normal;';
            
            const chk = document.createElement('input');
            chk.type = 'checkbox';
            chk.value = opt.value;
            const optValNum = Number(opt.value);
            chk.checked = safeValues.includes(opt.value) || safeValues.includes(String(opt.value)) || safeValues.includes(optValNum);
            chk.style.marginRight = '8px';

            chk.addEventListener('change', () => {
                let current = [...safeValues];
                if (chk.checked) {
                    if (!current.includes(optValNum)) current.push(optValNum);
                } else {
                    current = current.filter(v => Number(v) !== optValNum);
                }
                safeValues.length = 0;
                safeValues.push(...current);
                onChange([...safeValues]);
            });

            lbl.appendChild(chk);
            lbl.appendChild(document.createTextNode(opt.label));
            container.appendChild(lbl);
        });
    }

    wrapper.appendChild(container);
    
    if (helpTexts[key]) {
        const help = document.createElement('span');
        help.className = 'help-text';
        help.textContent = helpTexts[key];
        wrapper.appendChild(help);
    }
    
    return wrapper;
}