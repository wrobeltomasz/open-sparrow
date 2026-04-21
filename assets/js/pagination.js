// pagination.js
import { renderGrid, getState } from './grid.js';
import { debugLog } from './debug.js';

let pageSize = 10;
let currentPage = 1;

// --- Setup pagination container and render controls ---
export function setupPagination(schema) {
  let paginationEl = document.getElementById('pagination');

  if (!paginationEl) {
    paginationEl = document.createElement('div');
    paginationEl.id = 'pagination';
    paginationEl.className = 'pagination';

    const gridSection = document.getElementById('gridSection');
    if (gridSection) {
      gridSection.appendChild(paginationEl);
    } else {
      document.body.appendChild(paginationEl);
    }
  }

  renderPagination(schema);
}

// --- Render pagination controls ---
export function renderPagination(schema) {
  const { filteredData } = getState();

  let totalPages = Math.ceil(filteredData.length / pageSize);
  if (totalPages === 0) totalPages = 1;

  if (currentPage > totalPages) {
    currentPage = totalPages;
  }

  const paginationEl = document.getElementById('pagination');
  if (!paginationEl) return;

  paginationEl.innerHTML = '';

  // Prev button
  const prevBtn = document.createElement('button');
  prevBtn.textContent = 'Prev';
  prevBtn.disabled = currentPage <= 1;

  prevBtn.addEventListener('click', async () => {
    if (currentPage > 1) {
      currentPage--;
      await renderGrid(schema);
    }
  });

  paginationEl.appendChild(prevBtn);

  // Page info
  const info = document.createElement('span');
  info.textContent = `Page ${currentPage} of ${totalPages}`;
  paginationEl.appendChild(info);

  // Next button
  const nextBtn = document.createElement('button');
  nextBtn.textContent = 'Next';
  nextBtn.disabled = currentPage >= totalPages;

  nextBtn.addEventListener('click', async () => {
    if (currentPage < totalPages) {
      currentPage++;
      await renderGrid(schema);
    }
  });

  paginationEl.appendChild(nextBtn);

  // ✅ Pagination info (correct placement AFTER UI is built)
  renderPaginationInfo(filteredData);

  debugLog("Pagination rendered", { currentPage, totalPages });
}

// --- Helpers ---
export function getPageState() {
  return { currentPage, pageSize };
}

export function setPageSize(size) {
  pageSize = size;
  currentPage = 1;
}

export function resetPagination() {
  currentPage = 1;
}

// --- Get paginated rows ---
export function getPageRows() {
  const { filteredData } = getState();

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  if (currentPage > totalPages) {
    currentPage = totalPages;
  }

  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;

  return filteredData.slice(start, end);
}

// --- Pagination info renderer ---
function renderPaginationInfo(filteredData) {
  const totalRecords = filteredData.length;

  const start = totalRecords === 0
    ? 0
    : (currentPage - 1) * pageSize + 1;

  const end = Math.min(currentPage * pageSize, totalRecords);

  let infoEl = document.getElementById('pagination-info');

  if (!infoEl) {
    infoEl = document.createElement('span');
    infoEl.id = 'pagination-info';

    const paginationEl = document.getElementById('pagination');
    if (paginationEl) {
      paginationEl.prepend(infoEl);
    }
  }

  infoEl.textContent = `Showing ${start} to ${end} of ${totalRecords} records`;
}