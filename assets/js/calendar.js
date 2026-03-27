// assets/js/calendar.js
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let eventsData = [];
let appSchema = null; // Store schema object globally

// Init calendar when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    await fetchSchema();
    await fetchEvents();
    renderCalendar();

    document.getElementById('btnPrev').addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        renderCalendar();
    });

    document.getElementById('btnNext').addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        renderCalendar();
    });
});

// Fetch schema definition from backend
async function fetchSchema() {
    if (typeof window.schema !== 'undefined') {
        appSchema = window.schema;
        return;
    }
    if (typeof schema !== 'undefined') {
        appSchema = schema;
        return;
    }
    try {
        const res = await fetch('includes/schema.json');
        if (res.ok) {
            appSchema = await res.json();
        }
    } catch (err) {
        console.warn('Failed to fetch schema in calendar', err);
    }
}

// Fetch calendar events via API
async function fetchEvents() {
    try {
        const res = await fetch('api.php?api=calendar');
        const data = await res.json();
        eventsData = data.events || [];
    } catch (err) {
        console.error('Failed to load calendar events', err);
    }
}

// Render the main calendar grid
function renderCalendar() {
    const container = document.getElementById('calendarContainer');
    const title = document.getElementById('calendarTitle');
    
    container.innerHTML = '';

    // Initialize floating tooltip container
    let tooltip = document.getElementById('calendar-event-tooltip');
    if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.id = 'calendar-event-tooltip';
        tooltip.style.cssText = 'position: absolute; display: none; background: #fff; border: 1px solid #ddd; padding: 12px; border-radius: 6px; box-shadow: 0 5px 15px rgba(0,0,0,0.2); font-size: 13px; z-index: 10000; pointer-events: none; min-width: 220px; color: #333;';
        document.body.appendChild(tooltip);
    }
    
    const monthNames = [
        "January", "February", "March", "April", "May", "June", 
        "July", "August", "September", "October", "November", "December"
    ];
    title.textContent = `${monthNames[currentMonth]} ${currentYear}`;

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    days.forEach(day => {
        const div = document.createElement('div');
        div.className = 'calendar-day-name';
        div.textContent = day;
        container.appendChild(div);
    });

    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    
    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    for (let i = 0; i < startDayOfWeek; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'calendar-cell empty';
        container.appendChild(emptyCell);
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
        const cell = document.createElement('div');
        cell.className = 'calendar-cell';
        
        const dateNum = document.createElement('div');
        dateNum.className = 'calendar-date-num';
        dateNum.textContent = i;
        cell.appendChild(dateNum);
		
		const todayDate = new Date();
        if (i === todayDate.getDate() && 
            currentMonth === todayDate.getMonth() && 
            currentYear === todayDate.getFullYear()) {
            cell.classList.add('today');
        }

        const dateString = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        
        const dayEvents = eventsData.filter(e => e.date === dateString);
        dayEvents.forEach(ev => {
            const evEl = document.createElement('div');
            evEl.className = 'calendar-event';
            evEl.style.backgroundColor = ev.color;
            
            // Build icon safely without innerHTML
            if (ev.icon) {
                if (ev.icon.includes('/') || ev.icon.includes('.')) {
                    const img = document.createElement('img');
                    img.src = ev.icon;
                    img.style.cssText = 'width:14px; height:14px; vertical-align:middle; margin-right:4px;';
                    evEl.appendChild(img);
                } else {
                    const iconSpan = document.createElement('span');
                    iconSpan.style.marginRight = '4px';
                    iconSpan.textContent = ev.icon;
                    evEl.appendChild(iconSpan);
                }
            }
            
            // Append title safely
            const titleText = document.createTextNode(ev.title);
            evEl.appendChild(titleText);
            
            evEl.addEventListener('click', () => {
                window.location.href = `edit.php?table=${ev.table}&id=${ev.id}`;
            });

            // Handle tooltip hover event safely
            evEl.addEventListener('mouseenter', (e) => {
                tooltip.innerHTML = '';
                
                const headerDiv = document.createElement('div');
                headerDiv.style.cssText = 'font-weight: bold; font-size: 14px; margin-bottom: 8px; border-bottom: 1px solid #eee; padding-bottom: 5px;';
                headerDiv.textContent = ev.title;
                tooltip.appendChild(headerDiv);
                
                if (ev.rowData) {
                    for (const [key, val] of Object.entries(ev.rowData)) {
                        // Skip raw IDs and foreign key base names
                        if (key.endsWith('__display')) continue;
                        if (key === 'id') continue; 

                        let displayVal = ev.rowData[key + '__display'] ?? val;
                        
                        if (displayVal !== null && displayVal !== '') {
                            let label = key;
                            
                            // Get friendly name from schema
                            if (appSchema && appSchema.tables[ev.table]?.columns?.[key]) {
                                label = appSchema.tables[ev.table].columns[key].display_name || key;
                            }

                            // Build tooltip row safely
                            const rowDiv = document.createElement('div');
                            rowDiv.style.marginBottom = '4px';
                            
                            const strong = document.createElement('strong');
                            strong.style.color = '#555';
                            strong.textContent = `${label}: `;
                            
                            const spanVal = document.createElement('span');
                            spanVal.style.color = '#111';
                            spanVal.textContent = displayVal;
                            
                            rowDiv.appendChild(strong);
                            rowDiv.appendChild(spanVal);
                            tooltip.appendChild(rowDiv);
                        }
                    }
                }
                
                tooltip.style.display = 'block';

                const rect = evEl.getBoundingClientRect();
                
                // Position tooltip below or above the element dynamically
                let topPos = rect.bottom + window.scrollY + 5;
                if (topPos + tooltip.offsetHeight > window.innerHeight + window.scrollY) {
                    topPos = rect.top + window.scrollY - tooltip.offsetHeight - 5;
                }
                
                tooltip.style.left = (rect.left + window.scrollX) + 'px';
                tooltip.style.top = topPos + 'px';
            });

            // Hide tooltip on mouseleave
            evEl.addEventListener('mouseleave', () => {
                tooltip.style.display = 'none';
            });

            cell.appendChild(evEl);
        });

        container.appendChild(cell);
    }
}