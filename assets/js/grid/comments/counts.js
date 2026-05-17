import { debugLog } from '../../debug.js';
import { fetchCommentCounts } from '../api.js';
import { state } from '../state.js';

export async function loadCommentCounts(pageRows) {
    if (!state.currentTable || pageRows.length === 0) return;
    const ids = pageRows.map(r => r['id']).filter(Boolean).join(',');
    if (!ids) return;

    try {
        const counts = await fetchCommentCounts(state.currentTable, ids);
        for (const row of pageRows) {
            const rowId = String(row['id']);
            const td = document.querySelector(`[data-actions-row-id="${CSS.escape(rowId)}"]`);
            if (!td) continue;

            const cnt = counts[rowId] ?? 0;

            if (cnt > 0) {
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
            } else {
                const addBtn = document.createElement('button');
                addBtn.className = 'btn-icon-comment-add';
                addBtn.title = 'Add comment';
                const img = document.createElement('img');
                img.src = 'assets/icons/add_comment.png';
                img.alt = 'Add comment';
                addBtn.appendChild(img);
                addBtn.addEventListener('click', e => {
                    e.stopPropagation();
                    window.location.href = `edit.php?table=${encodeURIComponent(state.currentTable)}&id=${encodeURIComponent(rowId)}#tab-comments`;
                });
                td.appendChild(addBtn);
            }
        }
    } catch (err) {
        debugLog('comment counts failed', err);
    }
}
