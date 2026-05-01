import { debugLog } from '../../debug.js';
import { fetchCommentCounts } from '../api.js';
import { state } from '../state.js';

export async function loadCommentCounts(pageRows) {
    if (!state.currentTable || pageRows.length === 0) return;
    const ids = pageRows.map(r => r['id']).filter(Boolean).join(',');
    if (!ids) return;

    try {
        const counts = await fetchCommentCounts(state.currentTable, ids);
        for (const [rowId, cnt] of Object.entries(counts)) {
            if (cnt <= 0) continue;
            const td = document.querySelector(`[data-comment-row-id="${CSS.escape(rowId)}"]`);
            if (!td) continue;
            const badge = document.createElement('span');
            badge.className = 'c-count-badge';
            badge.textContent = String(cnt);
            badge.dataset.rowId = rowId;
            badge.title = 'Go to comments';
            badge.addEventListener('click', e => {
                e.stopPropagation();
                window.location.href = `edit.php?table=${encodeURIComponent(state.currentTable)}&id=${encodeURIComponent(rowId)}#tab-comments`;
            });
            td.appendChild(badge);
        }
    } catch (err) {
        debugLog('comment counts failed', err);
    }
}
