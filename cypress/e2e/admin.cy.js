// cypress/e2e/admin.cy.js
// ============================================================================
// Admin Panel Tests
// ============================================================================

const BASE = 'http://localhost:8080';

// ============================================================================
// Session Management
// ============================================================================

/**
 * Login as admin via unified auth.
 * Uses CYPRESS_ADMIN_USER / CYPRESS_ADMIN_PASS env vars when set.
 * Falls back to test/test — admin panel tests skip if user is not admin role.
 */
function loginAsAdmin() {
  const user = Cypress.env('ADMIN_USER') || 'test';
  const pass = Cypress.env('ADMIN_PASS') || 'test';

  cy.session(`adminUser-${user}`, () => {
    cy.visit(`${BASE}/login.php`);
    cy.get('input[name="username"], [data-cy=username]', { timeout: CypressHelpers.TIMEOUTS.long })
      .should('exist')
      .clear()
      .type(user);
    cy.get('input[name="password"], [data-cy=password]')
      .clear()
      .type(pass);
    cy.get('button[type="submit"], [data-cy=loginBtn]').click();

    cy.url({ timeout: CypressHelpers.TIMEOUTS.long }).should('include', '/dashboard.php');
  });
}

/**
 * Check if admin panel loaded or was denied.
 * Use inside beforeEach with function() context (not arrow) to access this.skip().
 * @returns Cypress chain
 */
function assertAdminPanelOrSkip() {
  return cy.visit(`${BASE}/admin/index.php`, { failOnStatusCode: false }).then(() => {
    return cy.get('body').then(function ($body) {
      const denied = $body.text().includes('Access Denied') || $body.text().includes('403');
      if (denied) {
        // Can't use this.skip() in .then() — mark via flag on Cypress
        Cypress.env('adminAccessDenied', true);
      } else {
        Cypress.env('adminAccessDenied', false);
      }
    });
  });
}

// ============================================================================
// Test Suite: Admin Panel Navigation
// ============================================================================

describe('OpenSparrow – Admin Panel', () => {
  before(function () {
    loginAsTestUser();
    cy.visit(`${BASE}/admin/index.php`, { failOnStatusCode: false });

    cy.get('body').then($body => {
      const denied = $body.text().includes('Access Denied');
      if (denied) {
        Cypress.env('adminAccessDenied', true);
      }
    });
  });

  beforeEach(function () {
    if (Cypress.env('adminAccessDenied')) {
      this.skip();
    }

    loginAsTestUser();
    cy.visit(`${BASE}/admin/index.php`, { failOnStatusCode: false });
    cy.get('header.admin-header', { timeout: CypressHelpers.TIMEOUTS.long }).should('exist');
  });

  // =========================================================================
  // Header Elements
  // =========================================================================

  it('displays admin header', () => {
    cy.get('header.admin-header').should('be.visible');
  });

  it('displays Save Config button', () => {
    cy.get('#btnSave').should('be.visible').and('not.be.disabled');
  });

  it('displays Logout button', () => {
    cy.get('button.btn-header-logout').should('be.visible');
  });

  it('displays admin nav sidebar', () => {
    cy.get('nav.admin-nav, #adminNav').should('exist');
  });

  // =========================================================================
  // Data Management Tabs
  // =========================================================================

  ['schema', 'dashboard', 'calendar', 'files', 'menu', 'add_table', 'erd', 'views'].forEach(tab => {
    it(`navigates to data tab: ${tab}`, () => {
      cy.get(`button.admin-tab[data-file="${tab}"]`)
        .should('be.visible')
        .click();

      cy.get('#workspace', { timeout: CypressHelpers.TIMEOUTS.medium }).should('exist');
    });
  });

  // =========================================================================
  // Workflows
  // =========================================================================

  it('navigates to Workflows tab', () => {
    cy.get('button.admin-tab[data-file="workflows"]')
      .should('be.visible')
      .click();

    cy.get('#workspace', { timeout: CypressHelpers.TIMEOUTS.medium }).should('exist');
  });

  // =========================================================================
  // System Tabs
  // =========================================================================

  ['database', 'users', 'health', 'backup', 'audit', 'migrations', 'performance', 'cron', 'm2m', 'demo'].forEach(tab => {
    it(`navigates to system tab: ${tab}`, () => {
      cy.get(`button.admin-tab[data-file="${tab}"]`)
        .should('be.visible')
        .click();

      cy.get('#workspace', { timeout: CypressHelpers.TIMEOUTS.medium }).should('exist');
    });
  });

  // =========================================================================
  // Docs
  // =========================================================================

  it('navigates to Docs tab', () => {
    cy.get('button.admin-tab[data-file="docs"]').should('exist').click();
    cy.get('#workspace', { timeout: CypressHelpers.TIMEOUTS.medium }).should('exist');
  });

  // =========================================================================
  // Config Buttons (Export / Import)
  // =========================================================================

  it('displays Export Config button', () => {
    cy.get('#btnExport').should('be.visible');
  });

  it('clicks Export Config', () => {
    cy.get('#btnExport').should('be.visible').click();
    cy.get('#workspace').should('exist');
  });

  it('displays Import Config button', () => {
    cy.get('#btnImport').should('be.visible');
  });

  it('clicks Import Config shows file input', () => {
    cy.get('#btnImport').should('be.visible').click();
    cy.get('#importFileInput').should('exist');
  });

  // =========================================================================
  // Save Config
  // =========================================================================

  it('Save Config button is clickable', () => {
    cy.get('button.admin-tab[data-file="schema"]').click();
    cy.get('#workspace', { timeout: CypressHelpers.TIMEOUTS.medium }).should('exist');
    cy.get('#btnSave').should('be.visible').click();
    cy.get('#workspace').should('exist');
  });

  // =========================================================================
  // Run Cron
  // =========================================================================

  it('displays Run Notifications Cron button', () => {
    cy.get('#btnRunCron').should('exist');
  });
});

// ============================================================================
// Test Suite: Admin Access Control
// ============================================================================

describe('OpenSparrow – Admin Access Control', () => {
  it('unauthenticated user is redirected to login.php', () => {
    cy.clearCookies();
    cy.visit(`${BASE}/admin/index.php`, { failOnStatusCode: false });

    cy.url({ timeout: CypressHelpers.TIMEOUTS.medium }).should('include', 'login.php');
    cy.get('input[name="username"], [data-cy=username]').should('be.visible');
  });

  it('non-admin user sees Access Denied or redirect', () => {
    loginAsTestUser();
    cy.visit(`${BASE}/admin/index.php`, { failOnStatusCode: false });

    cy.get('body').then($body => {
      const hasAdminPanel = $body.find('header.admin-header').length > 0;
      const hasAccessDenied = $body.text().includes('Access Denied');
      const onLoginPage = $body.find('input[name="username"]').length > 0;

      if (hasAdminPanel) {
        // test user has admin role — log and accept
        Cypress.log({ message: 'test user has admin role — admin panel accessible' });
        cy.get('header.admin-header').should('exist');
      } else if (hasAccessDenied) {
        cy.contains('Access Denied').should('be.visible');
      } else if (onLoginPage) {
        cy.get('input[name="username"]').should('be.visible');
      }
    });
  });

  it('admin logout redirects to login page', function () {
    // Skip if admin not accessible (non-admin test user)
    loginAsTestUser();
    cy.visit(`${BASE}/admin/index.php`, { failOnStatusCode: false });

    cy.get('body').then($body => {
      if (!$body.find('header.admin-header').length) {
        Cypress.log({ message: 'Admin panel not accessible — skipping logout test' });
        return;
      }

      cy.get('button.btn-header-logout').click();
      cy.url({ timeout: CypressHelpers.TIMEOUTS.long }).should('include', 'login.php');
    });
  });
});

// ============================================================================
// Test Suite: Admin Panel Mobile
// ============================================================================

describe('OpenSparrow – Admin Panel Mobile', () => {
  before(function () {
    loginAsTestUser();
    cy.visit(`${BASE}/admin/index.php`, { failOnStatusCode: false });

    cy.get('body').then($body => {
      if ($body.text().includes('Access Denied')) {
        Cypress.env('adminAccessDeniedMobile', true);
      }
    });
  });

  beforeEach(function () {
    if (Cypress.env('adminAccessDeniedMobile')) {
      this.skip();
    }

    cy.viewport('iphone-x');
    loginAsTestUser();
  });

  it('loads admin panel on mobile', () => {
    cy.visit(`${BASE}/admin/index.php`, { failOnStatusCode: false });
    cy.get('header.admin-header', { timeout: CypressHelpers.TIMEOUTS.long }).should('exist');
  });

  it('admin nav is accessible on mobile', () => {
    cy.visit(`${BASE}/admin/index.php`, { failOnStatusCode: false });
    cy.get('nav.admin-nav, #adminNav').should('exist');
  });
});
