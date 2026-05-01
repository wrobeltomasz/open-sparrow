export function applyDrillDown(element, table, filterCol = null, filterVal = null, filterWhere = null) {
    element.style.cursor = 'pointer';
    element.title = 'Click to view details';
    element.addEventListener('click', () => {
        let url = `index.php?table=${encodeURIComponent(table)}`;
        if (filterCol && filterVal !== null) {
            url += `&filter_col=${encodeURIComponent(filterCol)}&filter_val=${encodeURIComponent(filterVal)}`;
        } else if (filterWhere) {
            const m = /^(\w+)\s*=\s*'([^']*)'$/i.exec(filterWhere.trim());
            if (m) url += `&filter_col=${encodeURIComponent(m[1])}&filter_val=${encodeURIComponent(m[2])}`;
        }
        window.location.href = url;
    });
    element.addEventListener('mouseenter', () => { element.style.opacity = '0.8'; });
    element.addEventListener('mouseleave', () => { element.style.opacity = '1'; });
}
