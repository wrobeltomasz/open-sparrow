// admin/workflows.js
import { createTextInput, createSelectInput, createIconPicker } from './ui.js';

// Render the multi-step wizard configuration interface
export function renderWorkflowsEditor(key, itemData, isArray, ctx) {
    const { workspaceEl, getTableOptions, getColumnOptionsForTable, renderEditor } = ctx;

    // Check if editing the global root configuration object
    if (itemData.workflows !== undefined) {
        workspaceEl.innerHTML = '<h3>Global Workflow Settings</h3>';
        workspaceEl.appendChild(createTextInput('menu_name', 'Menu Name', itemData.menu_name || 'Workflows', v => itemData.menu_name = v));
        workspaceEl.appendChild(createIconPicker('menu_icon', 'Menu Icon', itemData.menu_icon || '', v => itemData.menu_icon = v));
        return;
    }

    // Ensure array structure for workflow steps
    if (!itemData.steps) itemData.steps = [];

    workspaceEl.appendChild(createTextInput('title', 'Workflow Title', itemData.title, v => itemData.title = v));
    workspaceEl.appendChild(createTextInput('description', 'Short Description', itemData.description || '', v => itemData.description = v));
    workspaceEl.appendChild(createIconPicker('icon', 'Workflow Icon', itemData.icon || '', v => {
        if (v && v.trim() !== '') itemData.icon = v; else delete itemData.icon;
    }));

    const stepsContainer = document.createElement('div');
    stepsContainer.style.marginTop = '30px';
    workspaceEl.appendChild(stepsContainer);

    function renderSteps() {
        stepsContainer.innerHTML = '<h3>Workflow Steps</h3>';
        
        itemData.steps.forEach((step, index) => {
            const block = document.createElement('div');
            block.className = 'column-block';
            block.style.borderLeft = '4px solid #8b5cf6';
            block.style.marginBottom = '20px';
            block.style.padding = '15px';
            block.style.background = '#f8fafc';

            const header = document.createElement('div');
            header.style.display = 'flex';
            header.style.justifyContent = 'space-between';
            header.style.marginBottom = '10px';

            const h4 = document.createElement('h4');
            h4.textContent = `Step ${index + 1}`;
            h4.style.margin = '0';

            const delBtn = document.createElement('button');
            delBtn.textContent = 'Delete Step';
            delBtn.style.cssText = 'background:none; border:none; color:red; cursor:pointer; font-weight:bold;';
            delBtn.onclick = () => {
                itemData.steps.splice(index, 1);
                renderSteps();
            };

            header.appendChild(h4);
            header.appendChild(delBtn);
            block.appendChild(header);

            block.appendChild(createTextInput('step_title', 'Step Name', step.title, v => step.title = v));
            
            // Add step description field
            block.appendChild(createTextInput('step_description', 'Step Description', step.description || '', v => step.description = v));
            
            block.appendChild(createSelectInput('step_table', 'Target Table', getTableOptions(), step.table || '', v => {
                step.table = v;
                step.foreign_key = ''; 
                renderSteps();
            }));

            // Multiple records option
            const multiOptions = [
                { value: 'false', label: 'No (Single record)' },
                { value: 'true', label: 'Yes (Multiple records)' }
            ];
            const currentMulti = step.allow_multiple ? 'true' : 'false';
            block.appendChild(createSelectInput('allow_multiple', 'Allow adding multiple records?', multiOptions, currentMulti, v => {
                step.allow_multiple = (v === 'true');
            }));

            // Map foreign key to previous steps
            if (index > 0 && step.table) {
                const colOptions = getColumnOptionsForTable(step.table);
                block.appendChild(createSelectInput('step_fk', 'Foreign Key (link to previous step)', colOptions, step.foreign_key || '', v => step.foreign_key = v));
                
                const prevSteps = [{value: '', label: '-- Select Previous Step --'}];
                for (let i = 0; i < index; i++) {
                    prevSteps.push({value: i.toString(), label: `Step ${i + 1}: ${itemData.steps[i].title || 'Unnamed'}`});
                }
                
                block.appendChild(createSelectInput('link_to_step', 'Link to ID from Step', prevSteps, (step.link_to_step !== undefined ? step.link_to_step.toString() : ''), v => step.link_to_step = parseInt(v)));
            }

            stepsContainer.appendChild(block);
        });

        const addBtn = document.createElement('button');
        addBtn.className = 'btn-add';
        addBtn.style.background = '#8b5cf6';
        addBtn.textContent = '+ Add Step';
        addBtn.onclick = () => {
            itemData.steps.push({ title: '', description: '', table: '', foreign_key: '', link_to_step: itemData.steps.length > 0 ? itemData.steps.length - 1 : 0, allow_multiple: false });
            renderSteps();
        };
        stepsContainer.appendChild(addBtn);
    }

    renderSteps();
}