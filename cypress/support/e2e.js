// cypress/support/e2e.js
// ============================================================================
// Shared Cypress helpers for OpenSparrow tests
// ============================================================================

const BASE = 'http://localhost:8080';

const TIMEOUTS = {
  short: 5000,
  medium: 8000,
  long: 15000,
};

// ============================================================================
// Session & Authentication
// ============================================================================

/**
 * Authenticate as test user in persistent session.
 * Session is reused across multiple tests (faster than re-login each time).
 */
function loginAsTestUser() {
  cy.session('testUser', () => {
    cy.visit(`${BASE}/index.php`);
    cy.get('[data-cy=username], input[name="username"]', { timeout: TIMEOUTS.long })
      .should('exist')
      .clear()
      .type('test');
    cy.get('[data-cy=password], input[name="password"]')
      .clear()
      .type('test');
    cy.get('[data-cy=loginBtn], button[type="submit"]')
      .click();

    cy.url({ timeout: TIMEOUTS.long }).should('include', '/dashboard.php');
    cy.get('#menu', { timeout: TIMEOUTS.long }).should('exist');
  });
}

/**
 * Authenticate as admin in persistent session.
 * Admin login is separate from user auth.
 */
function loginAsAdmin() {
  cy.session('adminUser', () => {
    cy.visit(`${BASE}/admin/index.php`);
    cy.get('input[name="admin_password"]', { timeout: TIMEOUTS.long })
      .should('exist')
      .clear()
      .type('admin');
    cy.get('button[type="submit"]').click();
    cy.get('.admin-header-tabs, .admin-workspace', { timeout: TIMEOUTS.long }).should('exist');
  });
}

// ============================================================================
// Grid Helpers
// ============================================================================

/**
 * Wait for grid to load OR empty-state to appear.
 * Tables may have no records → empty state instead of grid.
 * Returns { type: 'grid' | 'empty', element: HTMLElement }.
 */
function waitForGridOrEmpty({ timeout = TIMEOUTS.long } = {}) {
  const gridSel = '#grid, [data-cy=grid], table[id*="grid"], .datagrid, .grid-wrapper';
  const emptySel = '.no-data, .empty-state, .grid-empty, .no-results, [data-cy=empty-state]';

  return cy.document({ timeout }).then(doc => {
    const check = () => {
      const grid = doc.querySelector(gridSel);
      const empty = doc.querySelector(emptySel);

      if (grid) {
        return cy.wrap(grid).should('exist').then(() => ({ type: 'grid', element: grid }));
      }
      if (empty) {
        return cy.wrap(empty).should('exist').then(() => ({ type: 'empty', element: empty }));
      }

      return cy.wait(200, { log: false }).then(check);
    };

    return check();
  });
}

/**
 * Wait for action buttons to be available (Add/Export).
 * Handles both desktop (#actions buttons) and mobile (#mobileActions select).
 * Does not return a sync value from then() — avoids Cypress async/sync mixing error.
 */
function waitForActions({ timeout = TIMEOUTS.long } = {}) {
  return cy.get('#actions, #mobileActions', { timeout }).should('exist').then($container => {
    if ($container.is('#mobileActions')) {
      return cy.wrap($container)
        .find('option')
        .should('have.length.greaterThan', 0)
        .then(() => null);
    }

    return cy.wrap($container).within(() => {
      cy.get('[data-cy=export], #exportCsv')
        .should('exist')
        .and('be.visible');
    }).then(() => null);
  });
}

/**
 * Click Add button if it exists and optionally verify URL change.
 * Gracefully skips if button not present (read-only table).
 */
function clickAddIfPresent(tableParam = null) {
  const addSel = '#addRow, [data-cy=add], [data-action="add"], .btn-add';
  const mobileSel = '#mobileActions';

  return cy.get('body').then($body => {
    if ($body.find(addSel).length > 0) {
      return cy
        .get(addSel)
        .first()
        .should('be.visible')
        .and('not.be.disabled')
        .scrollIntoView()
        .click()
        .then(() => {
          if (tableParam) {
            cy.url({ timeout: TIMEOUTS.long }).should('include', 'create.php');
          }
        });
    }

    if ($body.find(mobileSel).length > 0) {
      return cy
        .get(mobileSel)
        .select((i, el) => {
          const opts = Array.from(el.options);
          const match = opts.find(o => /add/i.test(o.value) || /add/i.test(o.text));
          return match ? match.value : null;
        })
        .then(() => {
          if (tableParam) {
            cy.url({ timeout: TIMEOUTS.long }).should('include', 'create.php');
          }
        });
    }

    Cypress.log({ name: 'clickAddIfPresent', message: 'Add button not found (read-only)' });
  });
}

/**
 * Tolerant pagination check — verify pagination exists if table has enough records.
 * Returns true if found, false if not (both are acceptable).
 */
function waitForPagination({ timeout = TIMEOUTS.medium } = {}) {
  const pagSel = '#pagination, [data-cy=pagination], .pagination, [data-testid="pagination"]';

  return cy.document({ timeout }).then(doc => {
    const check = start => {
      const pag = doc.querySelector(pagSel);
      if (pag) {
        return cy.wrap(pag).scrollIntoView().should('exist').then(() => true);
      }

      if (Date.now() - start > timeout) {
        Cypress.log({
          name: 'waitForPagination',
          message: `Not found after ${timeout}ms (acceptable — may be single page)`,
        });
        return false;
      }

      return cy.wait(200, { log: false }).then(() => check(start));
    };

    return check(Date.now());
  });
}

// ============================================================================
// Expose helpers as window globals so test files can call them directly
// ============================================================================

window.BASE = BASE;
window.TIMEOUTS = TIMEOUTS;
window.loginAsTestUser = loginAsTestUser;
window.loginAsAdmin = loginAsAdmin;
window.waitForGridOrEmpty = waitForGridOrEmpty;
window.waitForActions = waitForActions;
window.clickAddIfPresent = clickAddIfPresent;
window.waitForPagination = waitForPagination;

// Also available via namespaced object
window.CypressHelpers = {
  BASE,
  TIMEOUTS,
  loginAsTestUser,
  loginAsAdmin,
  waitForGridOrEmpty,
  waitForActions,
  clickAddIfPresent,
  waitForPagination,
};
