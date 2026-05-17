# Example Test Patterns
## Practical Implementation Guide for Cypress Tests

---

## Example 1: Simple User Journey Test

### Scenario
"User logs in and navigates to Company grid"

### ❌ Bad Implementation
```javascript
it('user logs in and navigates', () => {
  // No setup, unclear initial state
  cy.visit('http://localhost:8080/index.php'); // Magic URL
  cy.get('input').eq(0).type('test'); // Which input? nth-child is brittle
  cy.get('input').eq(1).type('test');
  cy.get('button').click(); // Which button?
  cy.wait(3000); // Arbitrary delay
  cy.get('div').contains('Company').click(); // Class not tested
  // No assertions, no verification
});
```

**Problems:**
- Unclear selectors (nth-child, div > button)
- Magic URL hardcoded
- Arbitrary delay (flaky)
- No assertions (what are we verifying?)
- No setup/helper usage

### ✅ Good Implementation
```javascript
describe('User authentication flow', () => {
  // Constants at top
  const BASE = 'http://localhost:8080';

  // Reusable helper
  function loginAsTestUser() {
    cy.session('testUser', () => {
      cy.visit(`${BASE}/index.php`);
      cy.get('[data-cy=username]').clear().type('test');
      cy.get('[data-cy=password]').clear().type('test');
      cy.get('[data-cy=loginBtn]').click();
      cy.url().should('include', '/dashboard.php');
    });
  }

  // Shared setup
  beforeEach(() => {
    loginAsTestUser();
  });

  // Clear, focused test
  it('displays dashboard after successful login', () => {
    cy.visit(`${BASE}/dashboard.php`);
    cy.get('#menu').should('be.visible'); // What we expect to see
    cy.contains('.menu-text', 'Dashboard').should('be.visible');
  });

  it('navigates to Company grid', () => {
    cy.visit(`${BASE}/dashboard.php`);
    cy.get('[data-cy=menu-company]').should('be.visible').click();
    cy.url({ timeout: 8000 }).should('include', 'table=company');
    cy.get('[data-cy=grid-title]').should('contain.text', 'Company');
  });
});
```

**Improvements:**
- ✅ Clear selectors (data-cy first)
- ✅ Constants for URLs
- ✅ Reusable login helper
- ✅ Setup via beforeEach
- ✅ Explicit assertions (what must be true)
- ✅ Appropriate timeouts
- ✅ One behavior per test

---

## Example 2: Conditional Test (Feature May Not Be Present)

### Scenario
"Test Add button, but gracefully skip if user is read-only"

### ❌ Bad Implementation
```javascript
it('can add new record', () => {
  cy.visit(`${BASE}/index.php?table=company`);
  cy.get('#addRow').click(); // Fails if not present!
  cy.url().should('include', 'create.php');
});
```

**Problem:**
- Crashes if Add button doesn't exist (permission denied)
- No way to distinguish "permission denied" from "test failed"

### ✅ Good Implementation
```javascript
it('can add new record when permitted', () => {
  cy.visit(`${BASE}/index.php?table=company`);

  // Check if button exists, handle both cases
  cy.get('body').then($body => {
    const hasAddButton = $body.find('#addRow, [data-cy=add]').length > 0;

    if (!hasAddButton) {
      Cypress.log({
        name: 'addButton',
        message: 'Add button not present (likely read-only role)',
      });
      return; // Gracefully skip
    }

    // Button exists, test it
    cy.get('#addRow, [data-cy=add]')
      .first()
      .should('be.visible')
      .and('not.be.disabled')
      .click();

    cy.url({ timeout: 8000 }).should('include', 'create.php');
  });
});
```

**Improvements:**
- ✅ Handles both cases (button present/absent)
- ✅ Clear log message (useful for CI)
- ✅ Doesn't crash on permission denied
- ✅ Fallback selectors (ID + data-cy)

---

## Example 3: Helper Function with Parameters

### Scenario
"Reusable helper to fill login form with different credentials"

### ❌ Bad Implementation
```javascript
// Helper with no parameters, only works for one user
function loginAsTest() {
  cy.get('input[name="username"]').type('test');
  cy.get('input[name="password"]').type('test');
  cy.get('button[type="submit"]').click();
}

// To test another user, must write new helper
function loginAsAdmin() {
  cy.get('input[name="username"]').type('admin');
  cy.get('input[name="password"]').type('admin123');
  cy.get('button[type="submit"]').click();
}
```

**Problems:**
- Duplication (violates DRY)
- Not flexible
- Hard to maintain

### ✅ Good Implementation
```javascript
/**
 * Authenticate as specified user.
 * 
 * Reuses session so multiple tests don't re-login.
 * Each user gets own session key.
 * 
 * @param {string} username - Login username
 * @param {string} password - Login password
 * @param {string} [sessionName] - Session key (defaults to username)
 * @returns {void}
 * @example
 *   loginWithCredentials('test', 'test');
 *   loginWithCredentials('admin', 'admin123', 'adminSession');
 */
function loginWithCredentials(username, password, sessionName = username) {
  cy.session(sessionName, () => {
    cy.visit(`${BASE}/index.php`);
    cy.get('[data-cy=username], input[name="username"]')
      .clear()
      .type(username);
    cy.get('[data-cy=password], input[name="password"]')
      .clear()
      .type(password);
    cy.get('[data-cy=loginBtn], button[type="submit"]').click();
    cy.url({ timeout: TIMEOUTS.long }).should('include', '/dashboard.php');
  });
}

// Usage - now flexible!
describe('Authentication', () => {
  it('test user can login', () => {
    loginWithCredentials('test', 'test');
    cy.visit(`${BASE}/dashboard.php`);
    cy.get('#menu').should('exist');
  });

  it('admin can login', () => {
    loginWithCredentials('admin', 'admin123', 'adminSession');
    cy.visit(`${BASE}/dashboard.php`);
    cy.get('#menu').should('exist');
  });

  it('invalid password fails', () => {
    cy.visit(`${BASE}/index.php`);
    cy.get('[data-cy=username]').type('test');
    cy.get('[data-cy=password]').type('wrongpassword');
    cy.get('[data-cy=loginBtn]').click();
    cy.get('[data-cy=error], .error').should('contain.text', 'Invalid');
  });
});
```

**Improvements:**
- ✅ JSDoc documentation
- ✅ Parameterized (reusable)
- ✅ Session management (fast)
- ✅ Flexible session names
- ✅ Fallback selectors
- ✅ Example usage in comment

---

## Example 4: Wait Helper with Return Value

### Scenario
"Wait for grid to load, but accept either grid OR empty state"

### ❌ Bad Implementation
```javascript
it('company grid displays or shows empty state', () => {
  cy.visit(`${BASE}/index.php?table=company`);
  // Assumes grid always loads, no empty state handling
  cy.get('#grid').should('exist');
});
```

**Problem:**
- Assumes grid always exists
- Fails if table is empty (empty state instead of grid)

### ✅ Good Implementation
```javascript
/**
 * Wait for either grid or empty-state to appear.
 * Some tables may have no records → empty state instead of grid.
 * 
 * Polls repeatedly until one appears, then returns which.
 * This allows tests to handle both gracefully.
 * 
 * @param {Object} options
 * @param {number} [options.timeout=15000] - Max wait time
 * @returns {Cypress.Chainable<{type: 'grid'|'empty'}>}
 * @example
 *   waitForGridOrEmpty().then(result => {
 *     if (result.type === 'grid') {
 *       cy.get('[data-cy=row]').should('have.length.gt', 0);
 *     } else {
 *       cy.get('.empty-state').should('contain.text', 'No records');
 *     }
 *   });
 */
function waitForGridOrEmpty({ timeout = TIMEOUTS.long } = {}) {
  const gridSelectors = '#grid, [data-cy=grid], table[id*="grid"]';
  const emptySelectors = '.empty-state, [data-cy=empty-state], .no-data';

  return cy.document({ timeout }).then(doc => {
    const check = () => {
      const grid = doc.querySelector(gridSelectors);
      const empty = doc.querySelector(emptySelectors);

      // Found grid
      if (grid) {
        return cy.wrap(grid)
          .should('exist')
          .then(() => ({ type: 'grid', element: grid }));
      }

      // Found empty state
      if (empty) {
        return cy.wrap(empty)
          .should('exist')
          .then(() => ({ type: 'empty', element: empty }));
      }

      // Neither found, retry
      return cy.wait(200, { log: false }).then(check);
    };

    return check();
  });
}

// Usage
describe('Grid display', () => {
  it('shows grid or empty state', () => {
    cy.visit(`${BASE}/index.php?table=company`);
    
    waitForGridOrEmpty().then(result => {
      if (result.type === 'grid') {
        cy.wrap(result.element)
          .find('tr')
          .should('have.length.gt', 0); // Has records
      } else {
        cy.wrap(result.element)
          .should('contain.text', 'No records'); // Empty
      }
    });
  });
});
```

**Improvements:**
- ✅ Handles both outcomes (grid + empty)
- ✅ Returns result object for branching logic
- ✅ Polling with retry (not hardcoded delay)
- ✅ Comprehensive JSDoc
- ✅ Flexible selectors

---

## Example 5: Assertion Patterns

### ❌ Bad Assertions
```javascript
it('user can search', () => {
  cy.visit(`${BASE}/index.php?table=company`);

  // Bad: Testing implementation detail
  cy.get('#searchInput').should('have.class', 'focused'); // Who cares about CSS class?

  // Bad: Unclear what "visible" means
  cy.get('.grid-row').should('be.visible');

  // Bad: Magic numbers
  cy.get('tr').should('have.length', 5); // How do we know it's 5?

  // Bad: No assertion, just logging
  cy.get('[data-cy=grid]').then($grid => {
    console.log('Grid loaded'); // What should happen next?
  });
});
```

### ✅ Good Assertions
```javascript
it('user can search and filter results', () => {
  cy.visit(`${BASE}/index.php?table=company`);
  waitForGridOrEmpty().should('have.property', 'type', 'grid');

  // Good: Clear state, user-visible
  cy.get('[data-cy=search]')
    .should('be.visible')
    .and('not.be.disabled');

  // Good: Test behavior, not implementation
  cy.get('[data-cy=search]')
    .type('Apple Inc');

  // Good: Assert result (fewer rows after search)
  cy.get('[data-cy=grid-row]', { timeout: TIMEOUTS.medium })
    .should('have.length.lessThan', 10); // Before search was >10

  // Good: Test actual content
  cy.get('[data-cy=company-name]')
    .first()
    .should('contain.text', 'Apple');
});
```

**Improvements:**
- ✅ Tests user-visible behavior
- ✅ Clear expectations (what must be true)
- ✅ No magic numbers (or explained context)
- ✅ Proper timeouts for async operations

---

## Example 6: Mobile vs Desktop Test

### Scenario
"Grid actions differ on mobile (select) vs desktop (buttons)"

### ✅ Good Implementation
```javascript
function waitForActions({ timeout = TIMEOUTS.long } = {}) {
  return cy.get('body').then($body => {
    const hasMobileSelect = $body.find('#mobileActions').length > 0;
    const hasDesktopButtons = $body.find('#actions button').length > 0;

    if (hasMobileSelect) {
      // Mobile: <select> element
      return cy.get('#mobileActions')
        .find('option')
        .should('have.length.gt', 0)
        .then(() => ({ platform: 'mobile' }));
    }

    if (hasDesktopButtons) {
      // Desktop: buttons
      return cy.get('#actions')
        .within(() => {
          cy.get('[data-cy=add]')
            .should('be.visible');
          cy.get('[data-cy=export]')
            .should('be.visible');
        })
        .then(() => ({ platform: 'desktop' }));
    }

    throw new Error('Actions container not found');
  });
}

describe('Grid actions', () => {
  beforeEach(() => {
    loginAsTestUser();
  });

  it('shows action buttons on desktop', () => {
    cy.viewport(1920, 1080); // Desktop
    cy.visit(`${BASE}/index.php?table=company`);
    waitForActions().should('have.property', 'platform', 'desktop');
  });

  it('shows action select on mobile', () => {
    cy.viewport('iphone-x'); // Mobile
    cy.visit(`${BASE}/index.php?table=company`);
    waitForActions().should('have.property', 'platform', 'mobile');
  });
});
```

**Improvements:**
- ✅ Tests both viewports
- ✅ Different selectors per platform
- ✅ Helper returns platform info
- ✅ Clear expectations per device

---

## Example 7: Error Case Testing

### Scenario
"Test that invalid login shows error message"

### ❌ Bad Implementation
```javascript
it('login error', () => {
  cy.visit(`${BASE}/index.php`);
  cy.get('[name="username"]').type('test');
  cy.get('[name="password"]').type('wrongpwd');
  cy.get('button').click();
  cy.get('.error').should('be.visible'); // Which error? May be hidden initially
});
```

**Problems:**
- Unclear error selector
- No timeout for error to appear
- No verification of error content

### ✅ Good Implementation
```javascript
describe('Login error handling', () => {
  it('shows error message with invalid credentials', () => {
    cy.visit(`${BASE}/index.php`);

    // Fill form
    cy.get('[data-cy=username]').clear().type('test');
    cy.get('[data-cy=password]').clear().type('wrongpassword');

    // Submit form
    cy.get('[data-cy=loginBtn]').click();

    // Wait for error to appear (async)
    cy.get('[data-cy=error], .alert-danger', { timeout: TIMEOUTS.medium })
      .should('be.visible')
      .and('contain.text', 'Invalid credentials');

    // Verify we're still on login page (not redirected)
    cy.url().should('include', 'index.php');
    cy.url().should('not.include', 'dashboard.php');
  });

  it('clears error when user retries', () => {
    cy.visit(`${BASE}/index.php`);

    // First attempt fails
    cy.get('[data-cy=username]').clear().type('test');
    cy.get('[data-cy=password]').clear().type('wrong');
    cy.get('[data-cy=loginBtn]').click();
    cy.get('[data-cy=error]', { timeout: TIMEOUTS.medium }).should('be.visible');

    // User corrects password
    cy.get('[data-cy=password]').clear().type('test'); // Correct password

    // Error clears (or new attempt hides it)
    cy.get('[data-cy=loginBtn]').click();
    cy.url({ timeout: TIMEOUTS.long }).should('include', 'dashboard.php');
  });
});
```

**Improvements:**
- ✅ Tests error appearance (async wait)
- ✅ Tests error content
- ✅ Verifies page state (still on login)
- ✅ Tests recovery (retry with correct credentials)

---

## Example 8: Data-Driven Test (Multiple Inputs)

### Scenario
"Test that certain menu items exist"

### ❌ Bad Implementation (Repetitive)
```javascript
it('has Dashboard menu item', () => {
  loginAsTestUser();
  cy.contains('.menu-text', 'Dashboard').should('be.visible');
});

it('has Company menu item', () => {
  loginAsTestUser();
  cy.contains('.menu-text', 'Company').should('be.visible');
});

it('has Employee menu item', () => {
  loginAsTestUser();
  cy.contains('.menu-text', 'Employee').should('be.visible');
});
// ... 10 more identical tests
```

**Problems:**
- Massive duplication
- Repeated setup (login)
- Hard to maintain

### ✅ Good Implementation (Data-Driven)
```javascript
describe('Menu items', () => {
  beforeEach(() => {
    loginAsTestUser();
    cy.visit(`${BASE}/dashboard.php`);
  });

  const menuItems = ['Dashboard', 'Company', 'Employee', 'Settings'];

  menuItems.forEach(item => {
    it(`displays ${item} in menu`, () => {
      cy.contains('.menu-text', item)
        .should('be.visible')
        .and('not.be.disabled');
    });
  });
});
```

**Improvements:**
- ✅ Single test template, multiple inputs
- ✅ DRY principle
- ✅ Easy to add/remove items
- ✅ Shared setup via beforeEach

---

## Example 9: Proper Cleanup (afterEach)

### Scenario
"Clean up state after tests (logout, delete temp data)"

### ✅ Good Implementation
```javascript
describe('Account management', () => {
  const testRecordId = null;

  afterEach(() => {
    // Clean up: logout and clear session
    cy.request('GET', `${BASE}/admin/index.php?logout=1`);
    
    // Optional: delete temp data from DB if integration test
    // cy.task('deleteRecord', testRecordId);
  });

  it('user can change password', () => {
    loginAsTestUser();
    cy.visit(`${BASE}/admin/index.php`);
    // ... test code ...
  });

  it('user can update profile', () => {
    loginAsTestUser();
    cy.visit(`${BASE}/admin/index.php`);
    // ... test code ...
  });
});
```

**Improvements:**
- ✅ Cleans up after each test
- ✅ Prevents side effects between tests
- ✅ Ensures fresh state for next test

---

## Quick Comparison: Before & After

| Aspect | ❌ Before | ✅ After |
|--------|----------|----------|
| **Setup** | Repeated login in each test | `beforeEach()` + `cy.session()` |
| **Selectors** | `cy.get('input').eq(0)` | `cy.get('[data-cy=username]')` |
| **Waits** | `cy.wait(2000)` | `cy.get('[data-cy=grid]', { timeout: 15000 })` |
| **Assertions** | `cy.get('div').should('exist')` | `cy.get('[data-cy=error]').should('contain.text', '...')` |
| **Helpers** | None, code duplicated | Parameterized, reusable helpers |
| **Errors** | Silent failure, unclear cause | Meaningful Cypress.log() messages |
| **Mobile** | Not tested | `cy.viewport()` for each platform |
| **Runtime** | 10+ seconds per test | <10 seconds (with session reuse) |

---

## Template: New Test File

```javascript
// cypress/e2e/my-feature.cy.js
// ============================================================================
// Feature: [Brief description of what's tested]
// Coverage: [What scenarios are covered]
// ============================================================================

const BASE = 'http://localhost:8080';

const TIMEOUTS = {
  short: 5000,
  medium: 8000,
  long: 15000,
};

// ============================================================================
// Helpers
// ============================================================================

/**
 * [What this helper does]
 * 
 * [Why it's needed / when to use]
 * 
 * @param {type} param - [Description]
 * @returns {Cypress.Chainable<type>}
 */
function myHelper() {
  // Implementation
}

// ============================================================================
// Tests
// ============================================================================

describe('My Feature', () => {
  beforeEach(() => {
    loginAsTestUser();
    cy.visit(`${BASE}/index.php?table=myTable`);
    cy.url().should('include', 'table=myTable');
  });

  it('describes behavior when X', () => {
    // Arrange (setup complete in beforeEach)
    // Act
    cy.get('[data-cy=button]').click();
    // Assert
    cy.get('[data-cy=result]', { timeout: TIMEOUTS.medium }).should('be.visible');
  });

  it('describes behavior when Y', () => {
    // Arrange
    // Act
    // Assert
  });
});
```

---

**Last Updated:** 2026-05-17
