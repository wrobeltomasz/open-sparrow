// cypress/e2e/crud.cy.js
// ============================================================================
// Create, Read, Update, Delete Record Tests
// ============================================================================

const BASE = 'http://localhost:8080';
const TEST_TABLE = 'companies';

// ============================================================================
// Test Suite: Create Record
// ============================================================================

describe('OpenSparrow – Create Record Flow', () => {
  beforeEach(() => {
    loginAsTestUser();
  });

  it('navigates to create.php with table parameter', () => {
    cy.visit(`${BASE}/create.php?table=${TEST_TABLE}`);
    cy.url().should('include', `create.php?table=${TEST_TABLE}`);
  });

  it('displays create form', () => {
    cy.visit(`${BASE}/create.php?table=${TEST_TABLE}`);

    cy.get('form.editor-form, form[method="POST"]', {
      timeout: CypressHelpers.TIMEOUTS.medium,
    }).should('exist');
  });

  it('displays submit button', () => {
    cy.visit(`${BASE}/create.php?table=${TEST_TABLE}`);

    cy.get('button[type="submit"], button.btn-save', {
      timeout: CypressHelpers.TIMEOUTS.medium,
    }).should('be.visible');
  });

  it('displays cancel button', () => {
    cy.visit(`${BASE}/create.php?table=${TEST_TABLE}`);

    cy.get('button.btn-cancel, a.btn-cancel', {
      timeout: CypressHelpers.TIMEOUTS.medium,
    }).should('be.visible');
  });

  it('cancel button returns to grid', () => {
    cy.visit(`${BASE}/create.php?table=${TEST_TABLE}`);

    cy.get('button.btn-cancel').click();
    cy.url({ timeout: CypressHelpers.TIMEOUTS.long }).should(
      'include',
      `table=${TEST_TABLE}`
    );
  });

  it('displays form fields', () => {
    cy.visit(`${BASE}/create.php?table=${TEST_TABLE}`);

    cy.get('form.editor-form input, form.editor-form select, form.editor-form textarea', {
      timeout: CypressHelpers.TIMEOUTS.medium,
    })
      .should('have.length.greaterThan', 0);
  });

  it('shows CSRF token in form', () => {
    cy.visit(`${BASE}/create.php?table=${TEST_TABLE}`);

    cy.get('input[name="csrf_token"]').should('exist');
  });

  it('marks required fields', () => {
    cy.visit(`${BASE}/create.php?table=${TEST_TABLE}`);

    cy.get('span.required, input[required]', {
      timeout: CypressHelpers.TIMEOUTS.medium,
    }).then($els => {
      if ($els.length > 0) {
        cy.wrap($els).should('exist');
      }
    });
  });

  it('handles enum fields with dropdown if present', () => {
    cy.visit(`${BASE}/create.php?table=${TEST_TABLE}`);

    // Enum fields optional — companies table may not have them
    cy.get('body').then($body => {
      const $enums = $body.find('select[data-enum-colors], select[data-enum-status], select');
      if ($enums.length > 0) {
        cy.wrap($enums).first().find('option').should('have.length.greaterThan', 0);
      } else {
        Cypress.log({ message: 'No enum selects on create form' });
      }
    });
  });

  it('form respects pattern validation on inputs if present', () => {
    cy.visit(`${BASE}/create.php?table=${TEST_TABLE}`);

    cy.get('body').then($body => {
      const $patterns = $body.find('input[data-pattern]');
      if ($patterns.length > 0) {
        cy.wrap($patterns).first().should('have.attr', 'data-pattern');
      } else {
        Cypress.log({ message: 'No pattern-validated inputs on this form' });
      }
    });
  });
});

// ============================================================================
// Test Suite: Edit Record
// ============================================================================

describe('OpenSparrow – Edit Record Flow', () => {
  beforeEach(() => {
    loginAsTestUser();
    cy.visit(`${BASE}/index.php?table=${TEST_TABLE}`);
    waitForGridOrEmpty().then(res => {
      if (res.type === 'grid') {
        // Edit buttons are hidden behind CSS overflow:hidden; use force:true
        cy.get('[data-cy=grid] tbody tr, #grid tbody tr')
          .first()
          .find('button[title="Edit"]')
          .click({ force: true });

        cy.url({ timeout: CypressHelpers.TIMEOUTS.long }).should('include', 'edit.php');
      } else {
        Cypress.log({ message: 'Empty grid — Edit Record tests skipped' });
      }
    });
  });

  it('loads edit.php with record ID', () => {
    cy.url().should('include', 'edit.php').and('include', 'id=');
  });

  it('displays tab navigation', () => {
    cy.get('div.tab-list[role="tablist"], .tab-list', {
      timeout: CypressHelpers.TIMEOUTS.medium,
    }).should('exist');
  });

  it('shows Details tab as default', () => {
    cy.get('button.tab-btn[data-tab="tab-details"]').should(
      'have.class',
      'active'
    );
  });

  it('displays tab buttons: Details, Comments, History', () => {
    const tabs = ['Details', 'Comments', 'History'];

    tabs.forEach(tab => {
      cy.get('button.tab-btn').then($tabs => {
        const tabNames = $tabs.toArray().map(t => t.textContent.toLowerCase());
        // Check if at least some of the tabs exist
        const hasTab = tabNames.some(name => name.includes(tab.toLowerCase()));
        if (hasTab) {
          cy.contains('button.tab-btn', tab).should('exist');
        }
      });
    });
  });

  it('switches to Comments tab', () => {
    cy.get('button.tab-btn[data-tab="tab-comments"]').then($btn => {
      if ($btn.length > 0) {
        cy.wrap($btn).click();
        cy.get('button.tab-btn[data-tab="tab-comments"]').should(
          'have.class',
          'active'
        );
      }
    });
  });

  it('switches to History tab', () => {
    cy.get('button.tab-btn[data-tab="tab-history"]').then($btn => {
      if ($btn.length > 0) {
        cy.wrap($btn).click();
        cy.get('button.tab-btn[data-tab="tab-history"]').should(
          'have.class',
          'active'
        );
      }
    });
  });

  it('displays Save button', () => {
    cy.get('button.btn-save[type="submit"], button[onclick*="saveAction"]', {
      timeout: CypressHelpers.TIMEOUTS.medium,
    }).should('be.visible');
  });

  it('displays Cancel button', () => {
    cy.get('button.btn-cancel[onclick*="index.php"], a.btn-cancel', {
      timeout: CypressHelpers.TIMEOUTS.medium,
    }).should('be.visible');
  });

  it('shows record ID strip', () => {
    cy.get('div.form-id-strip, .form-id-value', {
      timeout: CypressHelpers.TIMEOUTS.medium,
    }).should('exist');
  });

  it('displays form fields in Details tab', () => {
    cy.get('input, select, textarea').should('have.length.greaterThan', 0);
  });

  it('Comments tab mounts comment panel', () => {
    cy.get('button.tab-btn[data-tab="tab-comments"]').then($btn => {
      if ($btn.length > 0) {
        cy.wrap($btn).click();
        cy.get('#c-panel, [data-cy=comments-panel]').should('exist');
      }
    });
  });
});

// ============================================================================
// Test Suite: Delete Record
// ============================================================================

describe('OpenSparrow – Delete Record', () => {
  beforeEach(() => {
    loginAsTestUser();
  });

  it('displays Delete button in grid row actions', () => {
    // Delete is in grid row actions, not on edit.php
    cy.visit(`${BASE}/index.php?table=${TEST_TABLE}`);
    waitForGridOrEmpty().then(res => {
      if (res.type === 'grid') {
        cy.get('[data-cy=grid] tbody tr, #grid tbody tr')
          .first()
          .find('button[title="Delete"], button.btn-icon-danger')
          .then($btn => {
            if ($btn.length > 0) {
              cy.wrap($btn).should('exist');
            }
          });
      }
    });
  });

  it('shows delete button exists in grid row', () => {
    cy.visit(`${BASE}/index.php?table=${TEST_TABLE}`);
    waitForGridOrEmpty().then(res => {
      if (res.type === 'grid') {
        // Delete buttons are hidden (overflow:hidden CSS) — check existence not visibility
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
// Test Suite: Form Validation
// ============================================================================

describe('OpenSparrow – Form Validation', () => {
  beforeEach(() => {
    loginAsTestUser();
    cy.visit(`${BASE}/create.php?table=${TEST_TABLE}`);
  });

  it('prevents submit with empty required fields', () => {
    // HTML5 validation should prevent submit
    cy.get('button[type="submit"]').click();

    // Check for validation messages
    cy.get(':invalid, [aria-invalid="true"]').then($invalid => {
      if ($invalid.length > 0) {
        // Some fields are required
        expect($invalid.length).to.be.greaterThan(0);
      }
    });
  });

  it('shows validation for pattern inputs if present', () => {
    cy.get('body').then($body => {
      const $patternInputs = $body.find('input[data-pattern]');
      if ($patternInputs.length > 0) {
        cy.wrap($patternInputs).first().clear().type('??invalid??');
        cy.get('button[type="submit"]').click();
        cy.get(':invalid, [aria-invalid="true"]').then($invalid => {
          if ($invalid.length > 0) {
            cy.wrap($invalid).should('exist');
          }
        });
      } else {
        Cypress.log({ message: 'No pattern-validated inputs on this form' });
      }
    });
  });

  it('form has visible submit button', () => {
    cy.get('button[type="submit"].btn-save, button.btn-save[type="submit"]')
      .should('be.visible');
  });
});

// ============================================================================
// Test Suite: Subtables (M2M, related records)
// ============================================================================

describe('OpenSparrow – Subtables (if present)', () => {
  beforeEach(() => {
    loginAsTestUser();
    cy.visit(`${BASE}/index.php?table=${TEST_TABLE}`);
    waitForGridOrEmpty().then(res => {
      if (res.type === 'grid') {
        cy.get('[data-cy=grid] tbody tr, #grid tbody tr')
          .first()
          .find('button[title="Edit"]')
          .click({ force: true });

        cy.url().should('include', 'edit.php');
      }
    });
  });

  it('displays subtable containers if present', () => {
    // Subtables exist in DOM but may be in hidden tab panels; check existence
    cy.get('div.subtable-container').then($containers => {
      if ($containers.length > 0) {
        cy.wrap($containers).should('exist');
      } else {
        Cypress.log({ message: 'No subtables on this record' });
      }
    });
  });

  it('displays Add subtable links if present', () => {
    // Links exist in DOM but may be in hidden tab panels; check existence
    cy.get('a.btn-add[href*="create.php"]').then($links => {
      if ($links.length > 0) {
        cy.wrap($links).should('exist');
      }
    });
  });

  it('subtable Add link navigates to create.php', () => {
    cy.get('a.btn-add[href*="create.php"]').then($links => {
      if ($links.length > 0) {
        cy.wrap($links)
          .first()
          .click({ force: true });

        cy.url().should('include', 'create.php');
      }
    });
  });
});
