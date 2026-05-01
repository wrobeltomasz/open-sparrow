import { state, sortRows } from '../state.js';

export function toggleSortState(col) {
    if (state.sortState.column === col) {
        if (state.sortState.asc) {
            state.sortState = { column: col, asc: false };
        } else {
            state.sortState = { column: null, asc: true };
        }
    } else {
        state.sortState = { column: col, asc: true };
    }

    state.filteredData = state.sortState.column
        ? sortRows(state.unsortedFilteredData, state.sortState)
        : state.unsortedFilteredData.slice();
}
