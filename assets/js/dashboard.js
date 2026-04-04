// Initialize the dashboard and create the global date filter
async function initDashboard() {
    const container = document.getElementById('dashboardSection');
    if (!container) {
        console.error("Error: Container #dashboardSection not found");
        return;
    }

    let globalConfig = null;
    
    // Fetch configuration first to populate the widget selector
    try {
        const response = await fetch('api.php?api=dashboard');
        if (!response.ok) throw new Error('Network error');
        globalConfig = await response.json();
    } catch (e) {
        console.error('Error fetching initial dashboard config', e);
        return;
    }

    // Create the dashboard controls aligned to the left
    const controls = document.createElement('div');
    controls.className = 'dashboard-controls';
    controls.style.display = 'flex';
    controls.style.justifyContent = 'flex-start';
    controls.style.gap = '15px';
    controls.style.marginBottom = '20px';

    const selectStyle = "padding: 8px 16px; border-radius: 6px; border: 1px solid #cbd5e1; background-color: #ffffff; font-weight: bold; color: #334155; cursor: pointer; box-shadow: 0 1px 2px rgba(0,0,0,0.05);";

    // Target widget selector
    const targetSelect = document.createElement('select');
    targetSelect.style.cssText = selectStyle;
    targetSelect.appendChild(new Option('All widgets', 'all'));

    if (globalConfig && globalConfig.widgets) {
        globalConfig.widgets.forEach(w => {
            const wName = w.title || w.table || 'Unknown';
            const wId = w.id || w.table || '';
            targetSelect.appendChild(new Option(wName, wId));
        });
    }

    // Date range selector
    const dateSelect = document.createElement('select');
    dateSelect.style.cssText = selectStyle;

    const options = [
        { val: 'all', text: 'All dates' },
        { val: 'today', text: 'Today' },
        { val: '7d', text: 'Last 7 days' },
        { val: '30d', text: 'Last 30 days' },
        { val: 'this_month', text: 'This month' }
    ];

    options.forEach(o => {
        const opt = document.createElement('option');
        opt.value = o.val;
        opt.textContent = o.text;
        dateSelect.appendChild(opt);
    });

    // Handle updates when selectors change
    const updateDash = () => loadDashboardData(container, dateSelect.value, targetSelect.value);
    
    targetSelect.addEventListener('change', updateDash);
    dateSelect.addEventListener('change', updateDash);
    
    controls.appendChild(targetSelect);
    controls.appendChild(dateSelect);
    container.parentNode.insertBefore(controls, container);

    // Initial render
    renderWidgets(container, globalConfig);
}

// Fetch dashboard data based on filters
async function loadDashboardData(container, dateFilter, targetWidget) {
    container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #64748b;">Loading data...</div>';

    try {
        const response = await fetch(`api.php?api=dashboard&date_filter=${dateFilter}&date_target=${targetWidget}`);
        if (!response.ok) throw new Error('Network response was not ok');
        const config = await response.json();
        
        renderWidgets(container, config);
    } catch (error) {
        console.error('Error loading dashboard:', error);
        container.innerHTML = '<p style="grid-column: 1/-1; color:red;">Error occurred while loading dashboard data.</p>';
    }
}

// Render widgets inside the container
function renderWidgets(container, config) {
    container.innerHTML = ''; 

    if (!config || !config.widgets || config.widgets.length === 0) {
        container.innerHTML = '<p style="grid-column: 1/-1;">No widgets configured.</p>';
        return;
    }

    container.style.display = 'grid';
    container.style.gridTemplateColumns = config.layout?.columns || 'repeat(auto-fit, minmax(280px, 1fr))';
    container.style.gap = config.layout?.gap || '20px';

    config.widgets.forEach(widget => {
        const widgetEl = document.createElement('div');
        widgetEl.className = 'dash-widget';
        
        if (widget.type !== 'kpi_card' && widget.type !== 'stat_card') {
            const title = document.createElement('h3');
            title.textContent = widget.title;
            title.className = 'dash-title';
            widgetEl.appendChild(title);
        }

        // Route to appropriate rendering function
        switch (widget.type) {
            case 'kpi_card':
                widgetEl.appendChild(renderKPICard(widget));
                break;
            case 'stat_card':
                widgetEl.appendChild(renderStatCard(widget));
                break;
            case 'bar_chart':
                widgetEl.appendChild(renderBarChart(widget));
                break;
            case 'vertical_bar_chart':
                widgetEl.appendChild(renderVerticalBarChart(widget));
                break;
            case 'pie_chart':
                widgetEl.appendChild(renderPieChart(widget));
                break;
            case 'list':
                widgetEl.appendChild(renderList(widget));
                break;
            default:
                const err = document.createElement('p');
                err.textContent = `Unknown widget type: ${widget.type}`;
                widgetEl.appendChild(err);
        }

        container.appendChild(widgetEl);
    });
}

// Common click handler for drill down routing to grid list
function applyDrillDown(element, table, filterCol = null, filterVal = null, filterWhere = null) {
    element.style.cursor = 'pointer';
    element.title = 'Click to view details';
    element.addEventListener('click', () => {
        let url = `index.php?table=${encodeURIComponent(table)}`;
        if (filterCol && filterVal !== null) {
            url += `&filter_col=${encodeURIComponent(filterCol)}&filter_val=${encodeURIComponent(filterVal)}`;
        }
        if (filterWhere) {
            url += `&filter_where=${encodeURIComponent(filterWhere)}`;
        }
        window.location.href = url;
    });
    
    // Hover visual feedback
    element.addEventListener('mouseenter', () => element.style.opacity = '0.8');
    element.addEventListener('mouseleave', () => element.style.opacity = '1');
}

// Render a Key Performance Indicator card
function renderKPICard(widget) {
    const wrapper = document.createElement('div');
    wrapper.className = 'kpi-card';
    wrapper.style.borderLeft = `4px solid ${widget.color || '#333'}`;

    const info = document.createElement('div');
    const title = document.createElement('div');
    title.className = 'kpi-title';
    title.textContent = widget.title;
    
    const value = document.createElement('div');
    value.className = 'kpi-value';
    value.textContent = widget.data ?? 0;

    info.appendChild(title);
    info.appendChild(value);

    const iconContainer = document.createElement('div');
    iconContainer.className = 'kpi-icon';
    iconContainer.style.width = '32px';
    iconContainer.style.height = '32px';
    iconContainer.style.display = 'flex';
    iconContainer.style.alignItems = 'center';
    iconContainer.style.justifyContent = 'center';
    
    if (widget.icon && widget.icon.trim() !== '') {
        const img = document.createElement('img');
        img.src = widget.icon;
        img.alt = '';
        img.style.maxWidth = '100%';
        img.style.maxHeight = '100%';
        img.style.objectFit = 'contain';
        iconContainer.appendChild(img);
    }

    wrapper.appendChild(info);
    wrapper.appendChild(iconContainer);
    
    // Drill down for the entire card
    applyDrillDown(wrapper, widget.table, null, null, widget.query?.where);
    
    return wrapper;
}

// Render a simple statistics card showing a total count
function renderStatCard(widget) {
    const wrapper = document.createElement('div');
    wrapper.className = 'stat-card';
    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'column';
    wrapper.style.alignItems = 'center';
    wrapper.style.justifyContent = 'center';
    wrapper.style.padding = '20px';
    wrapper.style.borderRadius = '8px';
    wrapper.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
    wrapper.style.transition = 'transform 0.2s, box-shadow 0.2s';
    
    if (widget.color) {
        wrapper.style.backgroundColor = widget.color;
        wrapper.style.color = '#ffffff';
    } else {
        wrapper.style.backgroundColor = '#ffffff';
        wrapper.style.color = '#333333';
    }

    const value = document.createElement('div');
    value.className = 'stat-value';
    value.textContent = widget.data ?? 0;
    value.style.fontSize = '2.5rem';
    value.style.fontWeight = 'bold';
    value.style.marginBottom = '5px';

    const title = document.createElement('div');
    title.className = 'stat-title';
    title.textContent = widget.title;
    title.style.fontSize = '0.9rem';
    title.style.textTransform = 'uppercase';
    title.style.letterSpacing = '1px';

    wrapper.appendChild(value);
    wrapper.appendChild(title);

    // Drill down for the entire card
    applyDrillDown(wrapper, widget.table, null, null, widget.query?.where);
    
    wrapper.addEventListener('mouseenter', () => wrapper.style.transform = 'translateY(-2px)');
    wrapper.addEventListener('mouseleave', () => wrapper.style.transform = 'none');

    return wrapper;
}

// Render a horizontal bar chart
function renderBarChart(widget) {
    const wrapper = document.createElement('div');
    wrapper.className = 'bar-chart';
    const data = widget.data || [];

    if (data.length === 0) {
        wrapper.textContent = 'No data';
        return wrapper;
    }

    const maxVal = Math.max(...data.map(d => parseFloat(d.value)));
    const groupCol = widget.query?.group_column;

    data.forEach(row => {
        const rowEl = document.createElement('div');
        rowEl.className = 'bar-row';

        const label = document.createElement('div');
        label.className = 'bar-label';
        label.textContent = row.label || 'None';

        const track = document.createElement('div');
        track.className = 'bar-track';

        const bar = document.createElement('div');
        bar.className = 'bar-fill';
        
        if (widget.color) {
            bar.style.backgroundColor = widget.color;
        }
        
        const percent = maxVal > 0 ? (row.value / maxVal) * 100 : 0;
        setTimeout(() => { bar.style.width = `${percent}%`; }, 50);

        const val = document.createElement('div');
        val.className = 'bar-value';
        val.textContent = row.value;

        track.appendChild(bar);
        rowEl.appendChild(label);
        rowEl.appendChild(track);
        rowEl.appendChild(val);
        
        // Drill down specifically for this category
        applyDrillDown(rowEl, widget.table, groupCol, row.label, widget.query?.where);
        
        wrapper.appendChild(rowEl);
    });

    return wrapper;
}

// Render a vertical bar chart
function renderVerticalBarChart(widget) {
    const wrapper = document.createElement('div');
    wrapper.className = 'vertical-bar-chart';
    wrapper.style.display = 'flex';
    wrapper.style.alignItems = 'flex-end';
    wrapper.style.justifyContent = 'space-around';
    wrapper.style.gap = '10px';
    wrapper.style.height = '250px';
    wrapper.style.paddingTop = '20px';
    wrapper.style.borderBottom = '1px solid #e2e8f0';
    wrapper.style.marginTop = '10px';
    
    const data = widget.data || [];
    if (data.length === 0) {
        wrapper.textContent = 'No data';
        return wrapper;
    }

    const maxVal = Math.max(...data.map(d => parseFloat(d.value)));
    const groupCol = widget.query?.group_column;

    data.forEach(row => {
        const colEl = document.createElement('div');
        colEl.style.display = 'flex';
        colEl.style.flexDirection = 'column';
        colEl.style.alignItems = 'center';
        colEl.style.flex = '1';
        colEl.style.height = '100%';
        colEl.style.justifyContent = 'flex-end';

        const val = document.createElement('div');
        val.textContent = row.value;
        val.style.fontSize = '12px';
        val.style.marginBottom = '5px';
        val.style.fontWeight = 'bold';

        const track = document.createElement('div');
        track.style.width = '100%';
        track.style.maxWidth = '50px';
        track.style.height = '100%';
        track.style.backgroundColor = '#f1f5f9';
        track.style.display = 'flex';
        track.style.alignItems = 'flex-end';
        track.style.borderRadius = '4px 4px 0 0';
        track.style.overflow = 'hidden';

        const bar = document.createElement('div');
        bar.style.width = '100%';
        bar.style.backgroundColor = widget.color || '#3b82f6';
        bar.style.transition = 'height 0.6s ease-out';
        bar.style.height = '0%';

        const percent = maxVal > 0 ? (row.value / maxVal) * 100 : 0;
        setTimeout(() => { bar.style.height = `${percent}%`; }, 50);

        const label = document.createElement('div');
        label.textContent = row.label || 'None';
        label.style.fontSize = '12px';
        label.style.marginTop = '8px';
        label.style.textAlign = 'center';
        label.style.whiteSpace = 'nowrap';
        label.style.overflow = 'hidden';
        label.style.textOverflow = 'ellipsis';
        label.style.width = '100%';

        track.appendChild(bar);
        colEl.appendChild(val);
        colEl.appendChild(track);
        colEl.appendChild(label);
        
        // Drill down specifically for this vertical bar
        applyDrillDown(colEl, widget.table, groupCol, row.label, widget.query?.where);
        
        wrapper.appendChild(colEl);
    });

    return wrapper;
}

// Render a pie chart using conic gradients
function renderPieChart(widget) {
    const wrapper = document.createElement('div');
    wrapper.className = 'pie-chart-wrapper';
    wrapper.style.display = 'flex';
    wrapper.style.alignItems = 'center';
    wrapper.style.justifyContent = 'center';
    wrapper.style.gap = '30px';
    wrapper.style.marginTop = '20px';
    wrapper.style.flexWrap = 'wrap';

    const data = widget.data || [];
    if (data.length === 0) {
        wrapper.textContent = 'No data';
        return wrapper;
    }

    const total = data.reduce((sum, d) => sum + parseFloat(d.value), 0);
    if (total === 0) {
        wrapper.textContent = 'Sum is zero';
        return wrapper;
    }

    const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
    const groupCol = widget.query?.group_column;
    
    let conicStops = [];
    let currentAngle = 0;
    
    const legend = document.createElement('div');
    legend.style.display = 'flex';
    legend.style.flexDirection = 'column';
    legend.style.gap = '8px';
    legend.style.flex = '0 1 auto';
    legend.style.minWidth = '150px';

    data.forEach((row, idx) => {
        const val = parseFloat(row.value);
        const percent = (val / total) * 100;
        const deg = (val / total) * 360;
        const color = colors[idx % colors.length];
        
        conicStops.push(`${color} ${currentAngle}deg ${currentAngle + deg}deg`);
        currentAngle += deg;

        const legendItem = document.createElement('div');
        legendItem.style.display = 'flex';
        legendItem.style.alignItems = 'center';
        legendItem.style.gap = '10px';
        legendItem.style.fontSize = '13px';
        
        const colorBox = document.createElement('div');
        colorBox.style.width = '14px';
        colorBox.style.height = '14px';
        colorBox.style.backgroundColor = color;
        colorBox.style.borderRadius = '3px';
        
        const label = document.createElement('span');
        label.textContent = `${row.label || 'None'} - ${val} (${percent.toFixed(1)}%)`;
        
        legendItem.appendChild(colorBox);
        legendItem.appendChild(label);
        
        // Drill down for the specific pie slice
        applyDrillDown(legendItem, widget.table, groupCol, row.label, widget.query?.where);
        
        legend.appendChild(legendItem);
    });

    const pie = document.createElement('div');
    pie.style.width = '180px';
    pie.style.height = '180px';
    pie.style.borderRadius = '50%';
    pie.style.background = `conic-gradient(${conicStops.join(', ')})`;
    pie.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
    pie.style.flexShrink = '0';

    wrapper.appendChild(pie);
    wrapper.appendChild(legend);

    return wrapper;
}

// Render a data list with direct routing to edit form
function renderList(widget) {
    const wrapper = document.createElement('div');
    wrapper.className = 'dash-list';
    
    if (widget.color) {
        wrapper.style.borderTop = `3px solid ${widget.color}`;
    }

    const data = widget.data || [];

    if (data.length === 0) {
        wrapper.textContent = 'No data';
        return wrapper;
    }

    const ul = document.createElement('ul');
    data.forEach(row => {
        const li = document.createElement('li');
        li.textContent = widget.display_columns.map(col => row[col] || '').join(' - ');
        
        // Direct route to record edit form
        if (row.id) {
            li.style.cursor = 'pointer';
            li.title = 'Click to edit record';
            li.addEventListener('click', () => {
                window.location.href = `edit.php?table=${encodeURIComponent(widget.table)}&id=${row.id}`;
            });
            li.addEventListener('mouseenter', () => li.style.color = '#3b82f6');
            li.addEventListener('mouseleave', () => li.style.color = '');
        }
        ul.appendChild(li);
    });

    wrapper.appendChild(ul);
    return wrapper;
}

// Initialize when DOM is fully loaded
document.addEventListener('DOMContentLoaded', initDashboard);