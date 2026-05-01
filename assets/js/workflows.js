import { showToast } from './toast.js';

// Fetch workflows configuration from backend
async function fetchWorkflowsConfig() {
    try {
        // Add CSRF header to prevent cross-site request forgery
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content || '';
        const res = await fetch('api.php?api=workflows', {
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-Token': csrfToken
            }
        });
        if (!res.ok) throw new Error('Network response was not ok');
        return await res.json();
    } catch (e) {
        console.warn('Could not load workflows config', e);
        return null;
    }
}

// Helper to safely render icons as DOM elements
function createIconElement(iconPath, fallbackColor = 'var(--accent)') {
    if (!iconPath) {
        const div = document.createElement('div');
        div.style.cssText = `width:20px; height:20px; background:${fallbackColor}; border-radius:50%; margin-right:8px; display:inline-block; vertical-align:middle;`;
        return div;
    }
    const img = document.createElement('img');
    img.src = iconPath;
    img.alt = '';
    img.style.cssText = 'width:20px; height:20px; vertical-align:middle; margin-right:8px; object-fit:contain;';
    return img;
}

// Main initialization function to be called from app.js
export async function initWorkflows(menuListEl, containerEl, titleEl, appSchema) {
    const config = await fetchWorkflowsConfig();

    if (!config || !config.workflows || config.workflows.length === 0) {
        return;
    }

    // Respect the "Hide from Sidebar Menu" flag from admin Global Settings
    if (config.hidden === true) {
        return;
    }

    // Restore grid UI elements when navigating back to standard tables
    document.addEventListener("tableLoaded", () => {
        const gridUI = document.querySelectorAll('.actions, #filterBar, #globalSearch, #columnFilter, #addRow');
        gridUI.forEach(el => el.style.display = '');
    });

    const menuName = config.menu_name || 'Workflows';

    // Wire the PHP-rendered link (menu.php already outputs it with data-page="workflows")
    const menuRoot = menuListEl.closest('#menu') ?? menuListEl;
    const wfLink = menuRoot.querySelector('a[data-page="workflows"]');

    if (wfLink) {
        wfLink.addEventListener('click', (e) => {
            e.preventDefault();
            menuRoot.querySelectorAll('a').forEach(l => l.classList.remove('active'));
            wfLink.classList.add('active');
            const uiToHide = document.querySelectorAll('.actions, #filterBar, #globalSearch, #columnFilter, #clearFilters, #addRow');
            uiToHide.forEach(el => el.style.display = 'none');
            renderWorkflowsList(config.workflows, containerEl, titleEl, menuName, appSchema);
        });
    }

    // Auto-show workflows view when page was loaded with ?workflows in URL
    if (new URLSearchParams(window.location.search).has('workflows')) {
        if (wfLink) {
            menuRoot.querySelectorAll('a').forEach(l => l.classList.remove('active'));
            wfLink.classList.add('active');
        }
        const uiToHide = document.querySelectorAll('.actions, #filterBar, #globalSearch, #columnFilter, #clearFilters, #addRow');
        uiToHide.forEach(el => el.style.display = 'none');
        renderWorkflowsList(config.workflows, containerEl, titleEl, menuName, appSchema);
    }
}

// Render the beautiful grid list of available workflows
function renderWorkflowsList(workflows, containerEl, titleEl, menuName, appSchema) {
    titleEl.textContent = menuName;
    containerEl.textContent = ''; // Safely clear container

    const listContainer = document.createElement('div');
    listContainer.style.display = 'grid';
    listContainer.style.gridTemplateColumns = 'repeat(auto-fill, minmax(320px, 1fr))';
    listContainer.style.gap = '24px';
    listContainer.style.padding = '24px';

    workflows.forEach(wf => {
        const card = document.createElement('div');
        
        // Premium UI styling based on provided CSS variables
        card.style.cssText = `
            display: flex;
            flex-direction: column;
            padding: 24px;
            background: var(--panel);
            border: 1px solid var(--border-light);
            border-radius: var(--radius-lg);
            cursor: pointer;
            box-shadow: var(--shadow-sm);
            transition: all var(--transition);
            position: relative;
        `;
        
        // Hover effects
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-3px)';
            card.style.boxShadow = 'var(--shadow-md)';
            card.style.borderColor = 'var(--border)';
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'none';
            card.style.boxShadow = 'var(--shadow-sm)';
            card.style.borderColor = 'var(--border-light)';
        });
        
        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.alignItems = 'center';
        header.style.gap = '14px';
        header.style.marginBottom = '14px';
        
        const iconWrapper = document.createElement('div');
        iconWrapper.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: center;
            width: 42px;
            height: 42px;
            background: var(--accent-light);
            border-radius: 8px;
        `;
        
        // Safely append image or placeholder
        if (wf.icon) {
            const img = document.createElement('img');
            img.src = wf.icon;
            img.alt = '';
            img.style.cssText = 'width:22px; height:22px; object-fit:contain;';
            iconWrapper.appendChild(img);
        } else {
            const div = document.createElement('div');
            div.style.cssText = 'width:22px; height:22px; background:var(--accent); border-radius:50%;';
            iconWrapper.appendChild(div);
        }

        const cardTitle = document.createElement('h3');
        cardTitle.style.margin = '0';
        cardTitle.style.color = 'var(--accent-dark)';
        cardTitle.style.fontSize = '1.15rem';
        cardTitle.style.fontWeight = '600';
        cardTitle.textContent = wf.title;
        
        header.appendChild(iconWrapper);
        header.appendChild(cardTitle);
        
        const cardDesc = document.createElement('p');
        cardDesc.style.color = 'var(--muted)';
        cardDesc.style.fontSize = '14px';
        cardDesc.style.margin = '0 0 20px 0';
        cardDesc.style.lineHeight = '1.5';
        cardDesc.style.flexGrow = '1';
        cardDesc.textContent = wf.description || 'No description provided for this workflow.';

        const footer = document.createElement('div');
        footer.style.display = 'flex';
        footer.style.alignItems = 'center';
        footer.style.justifyContent = 'space-between';
        footer.style.marginTop = 'auto';
        footer.style.paddingTop = '16px';
        footer.style.borderTop = '1px solid var(--border-light)';
        
        const stepCount = document.createElement('span');
        stepCount.style.fontSize = '12px';
        stepCount.style.color = 'var(--muted)';
        stepCount.style.fontWeight = '600';
        stepCount.style.textTransform = 'uppercase';
        stepCount.style.letterSpacing = '0.5px';
        stepCount.textContent = `${wf.steps.length} steps`;
        
        const startBtn = document.createElement('span');
        startBtn.style.fontSize = '13.5px';
        startBtn.style.color = 'var(--accent)';
        startBtn.style.fontWeight = '600';
        startBtn.textContent = 'Start Workflow \u2192';

        footer.appendChild(stepCount);
        footer.appendChild(startBtn);

        card.appendChild(header);
        card.appendChild(cardDesc);
        card.appendChild(footer);
        
        card.addEventListener('click', () => startWorkflow(wf, containerEl, titleEl, appSchema));
        
        listContainer.appendChild(card);
    });

    containerEl.appendChild(listContainer);
}

// Start and manage the step-by-step wizard
function startWorkflow(workflow, containerEl, titleEl, appSchema) {
    let currentStepIndex = 0;
    const stepResults = {}; 

    // Render a single step of the workflow
    async function renderCurrentStep() {
        if (currentStepIndex >= workflow.steps.length) {
            renderSuccessScreen();
            return;
        }

        const step = workflow.steps[currentStepIndex];
        
        // Set main title to show progress
        titleEl.textContent = `${workflow.title} - Step ${currentStepIndex + 1} of ${workflow.steps.length}`;
        containerEl.textContent = ''; // Safely clear container

        // Safely resolve schema with API fallback
        let activeSchema = appSchema;
        if (!activeSchema && typeof window !== 'undefined' && window.schema) {
            activeSchema = window.schema;
        }
        
        if (!activeSchema) {
            try {
                // Add CSRF header to schema fetch
                const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content || '';
                const res = await fetch('api.php?api=schema', {
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-CSRF-Token': csrfToken
                    }
                });
                if (res.ok) activeSchema = await res.json();
            } catch (err) {
                console.warn('Could not fetch schema dynamically', err);
            }
        }

        // Case-insensitive table matching for robust schema loading
        let tableSchema = activeSchema?.tables?.[step.table];
        if (!tableSchema && activeSchema?.tables) {
            const key = Object.keys(activeSchema.tables).find(k => k.toLowerCase() === step.table.toLowerCase());
            if (key) tableSchema = activeSchema.tables[key];
        }

        if (!tableSchema) {
            const errorMsg = document.createElement('p');
            errorMsg.style.cssText = 'color: red; text-align: center; margin-top: 40px;';
            errorMsg.textContent = `Error: Schema for table '${step.table}' not found.`;
            containerEl.appendChild(errorMsg);
            return;
        }

        const form = document.createElement('form');
        // Center the form and remove boxy styling to eliminate "white space" nesting
        form.style.maxWidth = '500px';
        form.style.margin = '40px auto';
        form.style.width = '100%';
        form.style.padding = '0 20px 40px 20px';

        // Render step title prominently inside the form
        if (step.title && step.title.trim() !== '') {
            const stepTitleEl = document.createElement('h2');
            stepTitleEl.style.marginTop = '0';
            stepTitleEl.style.marginBottom = '8px';
            stepTitleEl.style.color = 'var(--accent-dark)';
            stepTitleEl.style.fontSize = '22px';
            stepTitleEl.textContent = step.title;
            form.appendChild(stepTitleEl);
        }

        // Render step description if provided in admin
        if (step.description && step.description.trim() !== '') {
            const descEl = document.createElement('p');
            descEl.style.color = 'var(--muted)';
            descEl.style.fontSize = '14px';
            descEl.style.marginTop = '0';
            descEl.style.marginBottom = '24px';
            descEl.style.lineHeight = '1.5';
            descEl.textContent = step.description;
            form.appendChild(descEl);
        } else {
            // Add some spacing if there is no description but there is a title
            const spacer = document.createElement('div');
            spacer.style.height = '16px';
            form.appendChild(spacer);
        }

        // Generate form fields dynamically based on schema
        for (const [colName, colDef] of Object.entries(tableSchema.columns)) {
            if (colName === 'id' || colDef.readonly) continue;

            // Skip rendering the field if it will be automatically injected as a foreign key
            if (step.foreign_key === colName && step.link_to_step !== undefined && step.link_to_step !== "") {
                continue;
            }

            const formGroup = document.createElement('div');
            formGroup.style.marginBottom = '18px';

            const label = document.createElement('label');
            label.textContent = colDef.display_name || colName;
            label.style.display = 'block';
            label.style.marginBottom = '6px';
            label.style.fontWeight = '500';
            label.style.color = 'var(--text)';
            label.style.fontSize = '13.5px';

            let input;
            const type = (colDef.type || '').toLowerCase();

            // Render select dropdown for ENUM types
            if (type === 'enum' && Array.isArray(colDef.options)) {
                input = document.createElement('select');
                const defaultOpt = document.createElement('option');
                defaultOpt.value = '';
                defaultOpt.textContent = '-- Select --';
                input.appendChild(defaultOpt);

                colDef.options.forEach(optVal => {
                    const opt = document.createElement('option');
                    opt.value = optVal;
                    opt.textContent = optVal;
                    input.appendChild(opt);
                });
            } else if (type.includes('bool')) {
                input = document.createElement('input');
                input.type = 'checkbox';
            } else if (type.includes('date')) {
                input = document.createElement('input');
                input.type = 'date';
            } else {
                input = document.createElement('input');
                input.type = 'text';
            }

            input.name = colName;
            input.style.width = '100%';
            input.style.padding = '10px 12px';
            input.style.boxSizing = 'border-box';
            input.style.border = '1px solid var(--border)';
            input.style.borderRadius = 'var(--radius)';
            input.style.fontSize = '14px';
            input.style.color = 'var(--text)';
            input.style.transition = 'border-color var(--transition), box-shadow var(--transition)';
            input.style.background = '#fff';
            
            input.addEventListener('focus', () => {
                input.style.borderColor = 'var(--accent)';
                input.style.outline = 'none';
                input.style.boxShadow = '0 0 0 2px var(--accent-light)';
            });
            input.addEventListener('blur', () => {
                input.style.borderColor = 'var(--border)';
                input.style.boxShadow = 'none';
            });

            if (type.includes('bool')) {
                input.style.width = 'auto';
            }

            formGroup.appendChild(label);
            formGroup.appendChild(input);
            form.appendChild(formGroup);
        }

        // Add action buttons
        const btnContainer = document.createElement('div');
        btnContainer.style.marginTop = '24px';
        btnContainer.style.display = 'flex';
        btnContainer.style.gap = '12px';

        const submitBtn = document.createElement('button');
        submitBtn.type = 'submit';
        submitBtn.textContent = step.allow_multiple ? 'Save & Add Another' : 'Next step';
        submitBtn.style.cssText = 'padding: 10px 20px; background: var(--accent); color: white; border: none; border-radius: var(--radius); cursor: pointer; font-weight: 600; box-shadow: var(--shadow-sm); transition: background var(--transition);';
        
        submitBtn.addEventListener('mouseenter', () => submitBtn.style.background = 'var(--accent-dark)');
        submitBtn.addEventListener('mouseleave', () => submitBtn.style.background = 'var(--accent)');
        
        btnContainer.appendChild(submitBtn);

        let finishBtn = null;
        if (step.allow_multiple) {
            finishBtn = document.createElement('button');
            finishBtn.type = 'button';
            finishBtn.textContent = 'Finish this step';
            finishBtn.style.cssText = 'padding: 10px 20px; background: transparent; color: var(--muted); border: 1px solid var(--border); border-radius: var(--radius); cursor: pointer; font-weight: 600; transition: all var(--transition);';
            
            finishBtn.addEventListener('mouseenter', () => {
                finishBtn.style.color = 'var(--text)';
                finishBtn.style.borderColor = 'var(--muted)';
                finishBtn.style.background = '#f8fafc';
            });
            finishBtn.addEventListener('mouseleave', () => {
                finishBtn.style.color = 'var(--muted)';
                finishBtn.style.borderColor = 'var(--border)';
                finishBtn.style.background = 'transparent';
            });
            
            finishBtn.addEventListener('click', () => {
                currentStepIndex++;
                renderCurrentStep();
            });
            btnContainer.appendChild(finishBtn);
        }

        form.appendChild(btnContainer);

        const msgBox = document.createElement('div');
        msgBox.style.marginTop = '15px';
        msgBox.style.fontSize = '14px';
        msgBox.style.fontWeight = '500';
        form.appendChild(msgBox);

        // Handle form submission and data saving
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            submitBtn.disabled = true;
            if (finishBtn) finishBtn.disabled = true;
            submitBtn.textContent = 'Saving...';
            msgBox.textContent = ''; // Safely clear messages

            const payload = {};
            
            // Extract values from the form inputs securely
            for (const [colName, colDef] of Object.entries(tableSchema.columns)) {
                if (colName === 'id' || colDef.readonly) continue;
                
                if (step.foreign_key === colName && step.link_to_step !== undefined && step.link_to_step !== "") {
                    continue;
                }
                
                const inputEl = form.querySelector(`[name="${colName}"]`);
                if (!inputEl) continue;

                if (inputEl.type === 'checkbox') {
                    payload[colName] = inputEl.checked;
                } else {
                    if (inputEl.value !== "") {
                        payload[colName] = inputEl.value;
                    }
                }
            }

            // Automatically inject the foreign key from a previous step if required
            if (step.foreign_key && step.link_to_step !== undefined && step.link_to_step !== "") {
                const linkIndex = parseInt(step.link_to_step, 10);
                if (stepResults[linkIndex]) {
                    payload[step.foreign_key] = stepResults[linkIndex];
                }
            }

            try {
                // Add CSRF header to API request
                const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content || '';
                const response = await fetch('api.php', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-CSRF-Token': csrfToken
                    },
                    body: JSON.stringify({
                        table: step.table,
                        data: payload
                    })
                });

                // Fetch raw text first to intercept server-side HTML errors
                const rawText = await response.text();
                let result;

                try {
                    result = JSON.parse(rawText);
                } catch (parseError) {
                    console.error("RAW SERVER RESPONSE:", rawText);
                    const cleanError = rawText.replace(/<\/?[^>]+(>|$)/g, "").trim();
                    throw new Error(`Server Error (PHP/SQL): \n\n${cleanError.substring(0, 150)}... \n\n(Check F12 console for full log)`);
                }
                
                const isSuccess = result.ok === true || result.status === 'success' || result.success === true;

                if (isSuccess && result.id) {
                    if (!stepResults[currentStepIndex]) {
                        stepResults[currentStepIndex] = result.id;
                    }

                    if (step.allow_multiple) {
                        form.reset();
                        
                        // Safely create success message
                        const successSpan = document.createElement('span');
                        successSpan.style.color = 'var(--ok)';
                        successSpan.textContent = 'Record saved successfully. Add another or finish.';
                        msgBox.appendChild(successSpan);
                        
                        submitBtn.disabled = false;
                        if (finishBtn) finishBtn.disabled = false;
                        submitBtn.textContent = 'Save & Add Another';
                    } else {
                        currentStepIndex++;
                        renderCurrentStep(); 
                    }
                } else {
                    throw new Error(result.error || result.message || 'Unknown error occurred while saving.');
                }
            } catch (err) {
                console.error(err);
                showToast(`Error saving data: ${err.message}`, 'error');
                submitBtn.disabled = false;
                if (finishBtn) finishBtn.disabled = false;
                submitBtn.textContent = step.allow_multiple ? 'Save & Add Another' : 'Next step';
            }
        });

        containerEl.appendChild(form);
    }

    // Render the final success screen centered using DOM methods
    function renderSuccessScreen() {
        titleEl.textContent = 'Workflow Completed';
        containerEl.textContent = ''; // Safely clear container

        const wrapper = document.createElement('div');
        wrapper.style.cssText = 'margin: 60px auto; padding: 0 20px; text-align: center; max-width: 500px;';

        const heading = document.createElement('h2');
        heading.style.cssText = 'color: var(--ok); margin-top: 0; font-size: 28px;';
        heading.textContent = 'Success!';

        const paragraph = document.createElement('p');
        paragraph.style.cssText = 'color: var(--text); font-size: 15px; line-height: 1.6;';
        
        // Safely build mixed text and HTML elements
        const textStart = document.createTextNode('All steps of the ');
        const boldTitle = document.createElement('b');
        boldTitle.textContent = workflow.title;
        const textEnd = document.createTextNode(' workflow have been completed successfully.');
        
        paragraph.appendChild(textStart);
        paragraph.appendChild(boldTitle);
        paragraph.appendChild(textEnd);

        const finishBtn = document.createElement('button');
        finishBtn.id = 'wf-finish-btn';
        finishBtn.style.cssText = 'margin-top: 24px; padding: 10px 24px; background: var(--accent); color: white; border: none; border-radius: var(--radius); cursor: pointer; font-weight: 600; box-shadow: var(--shadow-sm); transition: background var(--transition);';
        finishBtn.textContent = 'Finish & Return';

        finishBtn.addEventListener('mouseenter', () => finishBtn.style.background = 'var(--accent-dark)');
        finishBtn.addEventListener('mouseleave', () => finishBtn.style.background = 'var(--accent)');
        finishBtn.addEventListener('click', () => window.location.reload());

        wrapper.appendChild(heading);
        wrapper.appendChild(paragraph);
        wrapper.appendChild(finishBtn);
        
        containerEl.appendChild(wrapper);
    }

    // Start the first step
    renderCurrentStep();
}