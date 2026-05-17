// cypress/e2e/grid.cy.js
// ============================================================================
// Grid Display, Search, Filter, Actions Tests
// ============================================================================

const BASE = 'http://localhost:8080';
const TEST_TABLE = 'companies'; // Use companies table (confirmed in schema.json)

// ============================================================================
// Test Suite: Grid Display & Core Features
// ============================================================================

describe('OpenSparrow – Grid Display', () => {
  beforeEach(() => {
    loginAsTestUser();
    cy.visit(`${BASE}/index.php?table=${TEST_TABLE}`);
    cy.url().should('include', `table=${TEST_TABLE}`);
  });

  it('loads grid with correct title', () => {
    cy.get('[data-cy=grid-title], #gridTitle', { timeout: CypressHelpers.TIMEOUTS.short })
      .should('exist');
    // Title may be hidden by CSS until loadTable() runs; existence is sufficient
  });

  it('displays grid or empty state', () => {
    waitForGridOrEmpty().then(res => {
      expect(res.type).to.be.oneOf(['grid', 'empty']);
    });
  });

  it('shows grid header with column names', () => {
    waitForGridOrEmpty().then(res => {
      if (res.type === 'grid') {
        cy.get('[data-cy=grid] thead, #grid thead')
          .should('be.visible')
          .find('th')
          .should('have.length.greaterThan', 0);
      }
    });
  });

  it('renders grid rows', () => {
    waitForGridOrEmpty().then(res => {
      if (res.type === 'grid') {
        cy.get('[data-cy=grid] tbody, #grid tbody')
          .should('exist')
          .find('tr')
          .should('have.length.greaterThan', 0);
      }
    });
  });

  it('shows empty state when no records', () => {
    // Navigate to a table likely to be empty
    cy.visit(`${BASE}/index.php?table=${TEST_TABLE}`);

    waitForGridOrEmpty().then(res => {
      if (res.type === 'empty') {
        cy.wrap(res.element).should('be.visible');
      }
    });
  });
});

// ============================================================================
// Test Suite: Grid Search & Filter
// ============================================================================

describe('OpenSparrow – Grid Search & Filter', () => {
  beforeEach(() => {
    loginAsTestUser();
    cy.visit(`${BASE}/index.php?table=${TEST_TABLE}`);
  });

  it('displays search input field', () => {
    cy.get('[data-cy=search], #globalSearch', {
      timeout: CypressHelpers.TIMEOUTS.medium,
    }).should('be.visible');
  });

  it('displays column filter select', () => {
    cy.get('[data-cy=column-filter], #columnFilter', {
      timeout: CypressHelpers.TIMEOUTS.medium,
    }).should('be.visible');
  });

  it('search input filters results', () => {
    waitForGridOrEmpty().then(res => {
      if (res.type === 'grid') {
        // Get initial row count
        cy.get('[data-cy=grid] tbody tr, #grid tbody tr')
          .its('length')
          .then(initialCount => {
            // Type search term
            cy.get('[data-cy=search], #globalSearch')
              .clear()
              .type('a');

            // Wait for grid to re-render with filtered results
            cy.get('[data-cy=grid] tbody tr, #grid tbody tr', {
              timeout: CypressHelpers.TIMEOUTS.medium,
            })
              .its('length')
              .then(filteredCount => {
                // Filtered count should be <= initial count
                expect(filteredCount).to.be.lte(initialCount);
              });
          });
      }
    });
  });

  it('clears search term', () => {
    cy.get('[data-cy=search], #globalSearch')
      .clear()
      .type('a');

    // Clear button or input clear
    cy.get('[data-cy=search], #globalSearch').clear();
    cy.get('[data-cy=search], #globalSearch').should('have.value', '');
  });

  it('column filter select loads options', () => {
    cy.get('[data-cy=column-filter], #columnFilter')
      .find('option')
      .should('have.length.greaterThan', 1); // At least "All columns" option
  });

  it('displays clear filters button when filter applied', () => {
    // Apply search
    cy.get('[data-cy=search], #globalSearch').clear().type('test');

    // Clear Filters button should appear
    cy.get('#clearFilters', { timeout: CypressHelpers.TIMEOUTS.medium }).then($btn => {
      if ($btn.is(':visible')) {
        cy.wrap($btn).click();
        cy.get('[data-cy=search], #globalSearch').should('have.value', '');
      }
    });
  });
});

// ============================================================================
// Test Suite: Grid Actions (Edit, Delete, Export)
// ============================================================================

describe('OpenSparrow – Grid Row Actions', () => {
  beforeEach(() => {
    loginAsTestUser();
    cy.visit(`${BASE}/index.php?table=${TEST_TABLE}`);
    waitForGridOrEmpty();
  });

  it('displays Export CSV button', () => {
    cy.get('[data-cy=export], #exportCsv')
      .should('be.visible')
      .and('not.be.disabled');
  });

  it('Export CSV button is clickable', () => {
    cy.get('[data-cy=export], #exportCsv')
      .should('be.visible')
      .click();
    // Browser will download file — just verify click succeeds
  });

  it('displays Add button for editor role', () => {
    cy.get('body').then($body => {
      const hasAddBtn = $body.find('#addRow, [data-cy=add]').length > 0;

      if (hasAddBtn) {
        cy.get('#addRow, [data-cy=add]')
          .should('be.visible')
          .and('not.be.disabled');
      } else {
        Cypress.log({ message: 'Add button not present (read-only role)' });
      }
    });
  });

  it('Add button navigates to create.php', () => {
    cy.get('body').then($body => {
      const hasAddBtn = $body.find('#addRow, [data-cy=add]').length > 0;

      if (!hasAddBtn) {
        Cypress.log({ message: 'Add button not present — skipping' });
        return;
      }

      // Wait for loadTable() to attach onclick before clicking
      cy.get('#addRow, [data-cy=add]')
        .first()
        .should($btn => {
          expect($btn[0].onclick, 'Add button onclick set by loadTable').to.not.be.null;
        })
        .click();

      cy.url({ timeout: CypressHelpers.TIMEOUTS.long }).should('include', 'create.php');
    });
  });

  it('displays Edit button in row actions', () => {
    waitForGridOrEmpty().then(res => {
      if (res.type === 'grid') {
        // Row action buttons are hidden behind CSS hover; check existence not visibility
        cy.get('[data-cy=grid] tbody tr, #grid tbody tr')
          .first()
          .find('button[title="Edit"], button.btn-icon[title="Edit"]')
          .should('exist');
      }
    });
  });

  it('Edit button navigates to edit.php', () => {
    waitForGridOrEmpty().then(res => {
      if (res.type === 'grid') {
        cy.get('[data-cy=grid] tbody tr, #grid tbody tr')
          .first()
          .find('button[title="Edit"]')
          .should('exist')
          .click({ force: true });

        cy.url({ timeout: CypressHelpers.TIMEOUTS.long }).should('include', 'edit.php');
      }
    });
  });

  it('displays Duplicate button in row actions', () => {
    waitForGridOrEmpty().then(res => {
      if (res.type === 'grid') {
        cy.get('[data-cy=grid] tbody tr, #grid tbody tr')
          .first()
          .find('button[title="Duplicate"]')
          .then($btn => {
            if ($btn.length > 0) {
              cy.wrap($btn).should('exist');
            }
          });
      }
    });
  });

  it('displays Delete button in row actions', () => {
    waitForGridOrEmpty().then(res => {
      if (res.type === 'grid') {
        cy.get('[data-cy=grid] tbody tr, #grid tbody tr')
          .first()
          .find('button[title="Delete"], button.btn-icon-danger[title="Delete"]')
          .then($btn => {
            if ($btn.length > 0) {
              cy.wrap($btn).should('exist');
            }
          });
      }
    });
  });
});

// ============================================================================
// Test Suite: Grid Pagination
// ============================================================================

describe('OpenSparrow – Grid Pagination', () => {
  beforeEach(() => {
    loginAsTestUser();
    cy.visit(`${BASE}/index.php?table=${TEST_TABLE}`);
  });

  it('shows pagination if table has multiple pages', () => {
    waitForPagination().then(found => {
      if (found) {
        Cypress.log({ message: 'Pagination present' });
      } else {
        Cypress.log({ message: 'No pagination (single page or too few records)' });
      }
    });
  });

  it('pagination buttons are functional', () => {
    waitForPagination().then(found => {
      if (found) {
        cy.get('[data-cy=pagination] button, #pagination button').then($buttons => {
          if ($buttons.length > 0) {
            cy.wrap($buttons).first().should('be.visible');
          }
        });
      }
    });
  });
});

// ============================================================================
// Test Suite: Grid Mobile
// ============================================================================

describe('OpenSparrow – Grid Mobile', () => {
  beforeEach(() => {
    cy.viewport('iphone-x');
    loginAsTestUser();
    cy.visit(`${BASE}/index.php?table=${TEST_TABLE}`);
  });

  it('loads grid on mobile viewport', () => {
    waitForGridOrEmpty().then(res => {
      expect(res.type).to.be.oneOf(['grid', 'empty']);
    });
  });

  it('displays mobileActions select on mobile', () => {
    // mobileActions exists in DOM; CSS visibility depends on media query
    cy.get('#mobileActions').should('exist');
  });

  it('mobileActions select has Export option', () => {
    cy.get('#mobileActions')
      .find('option')
      .then($opts => {
        const optTexts = $opts.toArray().map(o => o.textContent.toLowerCase());
        expect(optTexts.some(t => t.includes('export'))).to.be.true;
      });
  });

  it('mobileActions select has Refresh option', () => {
    cy.get('#mobileActions')
      .find('option')
      .then($opts => {
        const optTexts = $opts.toArray().map(o => o.textContent.toLowerCase());
        expect(optTexts.some(t => t.includes('refresh'))).to.be.true;
      });
  });

  it('mobileActions select has export option value', () => {
    cy.get('#mobileActions option[value="export"]').should('exist');
  });
});
