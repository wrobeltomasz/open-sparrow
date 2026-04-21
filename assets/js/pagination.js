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
    
    // Fallback in case the gridSection element is missing
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
  
  // Prevent displaying a weird "Page 1 of 0" when the table is empty
  let totalPages = Math.ceil(filteredData.length / pageSize);
  if (totalPages === 0) totalPages = 1; 

  // Auto-correction: If records were deleted and we fell out of page bounds, go back
  if (currentPage > totalPages) {
    currentPage = totalPages;
  }

  const paginationEl = document.getElementById('pagination');
  if (!paginationEl) return;
  
  paginationEl.innerHTML = '';

  const prevBtn = document.createElement('button');
  prevBtn.textContent = 'Prev';
  prevBtn.disabled = currentPage <= 1;
  
  // Added async to handle grid rendering promises
  prevBtn.addEventListener('click', async () => {
    if (currentPage > 1) {
      currentPage--;
      // Added await and removed redundant renderPagination call (renderGrid does it internally)
      await renderGrid(schema);
    }
  });
  paginationEl.appendChild(prevBtn);

  const info = document.createElement('span');
  info.textContent = `Page ${currentPage} of ${totalPages}`;
  paginationEl.appendChild(info);

  const nextBtn = document.createElement('button');
  nextBtn.textContent = 'Next';
  nextBtn.disabled = currentPage >= totalPages;
  
  // Added async to handle grid rendering promises
  nextBtn.addEventListener('click', async () => {
    if (currentPage < totalPages) {
      currentPage++;
      // Same as above: await renderGrid handles the pagination re-render
      await renderGrid(schema);
    }
  });
  paginationEl.appendChild(nextBtn);

  debugLog("Pagination rendered", { currentPage, totalPages });
}

// --- Helpers to expose ---
export function getPageState() {
  return { currentPage, pageSize };
}

export function setPageSize(size) {
  pageSize = size;
  currentPage = 1;
}

// Essential function for correct searching logic (called in app.js)
export function resetPagination() {
  currentPage = 1;
}

export function getPageRows() {
  const { filteredData } = getState();
  
  // Final check before slicing rows to ensure we are strictly on a valid page
  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  if (currentPage > totalPages) {
    currentPage = totalPages;
  }

  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
   renderPaginationInfo(filteredData);
  return filteredData.slice(start, end);
}
  

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