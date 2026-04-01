// assets/js/dashboard.js

// Initialize the dashboard and fetch widget configuration
async function initDashboard() {
    const container = document.getElementById('dashboardSection');
    if (!container) {
        console.error("Error: Container #dashboardSection not found");
        return;
    }

    try {
        const response = await fetch('api.php?api=dashboard');
        if (!response.ok) throw new Error('Network response was not ok');
        const config = await response.json();

        if (!config || !config.widgets || config.widgets.length === 0) {
            container.innerHTML = '<p>No widgets configured in dashboard.json.</p>';
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

    } catch (error) {
        console.error('Error loading dashboard:', error);
        container.innerHTML = '<p style="color:red;">An error occurred while loading dashboard data.</p>';
    }
}

// Render a Key Performance Indicator (KPI) card
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
    
    // Render icon as an image if path is provided
    if (widget.icon && widget.icon.trim() !== '') {
        const img = document.createElement('img');
        img.src = widget.icon;
        img.alt = 'Icon';
        img.style.maxWidth = '100%';
        img.style.maxHeight = '100%';
        img.style.objectFit = 'contain';
        iconContainer.appendChild(img);
    }

    wrapper.appendChild(info);
    wrapper.appendChild(iconContainer);
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
        
        // Timeout to trigger CSS transition animation
        setTimeout(() => { bar.style.width = `${percent}%`; }, 50);

        const val = document.createElement('div');
        val.className = 'bar-value';
        val.textContent = row.value;

        track.appendChild(bar);
        rowEl.appendChild(label);
        rowEl.appendChild(track);
        rowEl.appendChild(val);
        wrapper.appendChild(rowEl);
    });

    return wrapper;
}

// Render a simple data list
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
        // Safely extract and join columns configured in dashboard setup
        li.textContent = widget.display_columns.map(col => row[col] || '').join(' - ');
        ul.appendChild(li);
    });

    wrapper.appendChild(ul);
    return wrapper;
}

// Initialize when DOM is fully loaded
document.addEventListener('DOMContentLoaded', initDashboard);