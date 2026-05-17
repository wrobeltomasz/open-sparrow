# Cypress E2E Test Checklist
## Quick Reference for FE Test Modifications

---

## 📝 Before Writing Tests

- [ ] Understand happy path flow (user perspective, not implementation)
- [ ] Identify all assertions (what must be true after action?)
- [ ] Check if test already exists (avoid duplicates)
- [ ] Plan selectors: data-cy available? If not, use semantic HTML/role
- [ ] Estimate async time: AJAX, network, rendering

---

## ✍️ While Writing Tests

### Test Structure
- [ ] Test name: verb + condition (e.g., "displays error when password invalid")
- [ ] One behavior per test (not mega-test with 10 assertions)
- [ ] Use `beforeEach()` for common setup (login, navigate)
- [ ] Clear test → next reader understands purpose in 5 seconds

### Selectors (Priority Order)
- [ ] **[data-cy=name]** — exists? Use it (safest)
- [ ] **[aria-label="..."]** or role selectors — semantic & accessible
- [ ] **input[name="..."]** — form elements, name attr stable
- [ ] **.css-class** — only if #1-3 unavailable
- [ ] ❌ Avoid: `nth-child`, `>`, XPath, ID chains

### Assertions
- [ ] `.should('exist')` — element is in DOM
- [ ] `.should('be.visible')` — rendered and visible
- [ ] `.should('be.disabled')` — state check
- [ ] `.should('contain.text', '...')` — content (not `.text()`)
- [ ] `cy.url().should('include', '...')` — navigation
- [ ] ✅ **Every click needs assertion** (what changed?)

### Timeouts
```javascript
// At top of file
const TIMEOUTS = {
  short: 5000,   // DOM only
  medium: 8000,  // AJAX
  long: 15000,   // Page load
};

// In tests
cy.get('[data-cy=element]', { timeout: TIMEOUTS.long })
```

### Helpers (Reusable Functions)
- [ ] Extracted if used 2+ times
- [ ] Documented with JSDoc (what it does)
- [ ] Returns Cypress chain (so `.then()` works)
- [ ] Handles errors gracefully (don't crash test)
- [ ] Parameterized (table name, timeout, etc.)

Example:
```javascript
/**
 * Logs in as test user via cy.session.
 * Session reused across tests = faster runs.
 */
function loginAsTestUser() {
  cy.session('testUser', () => {
    cy.visit(`${BASE}/index.php`);
    cy.get('[data-cy=username]').type('test');
    cy.get('[data-cy=password]').type('test');
    cy.get('[data-cy=loginBtn]').click();
    cy.url().should('include', '/dashboard.php');
  });
}
```

---

## 🔍 Avoiding Flakiness

- [ ] ❌ No `cy.wait(1000)` → ✅ Wait for element `.should('exist')`
- [ ] ❌ No `.click()` blind → ✅ `.should('be.visible').click()`
- [ ] ❌ No assumption of order → ✅ Assert each step completes
- [ ] ❌ No .then() without return → ✅ Cypress chain continues
- [ ] ❌ No hardcoded IDs/nth-child → ✅ data-cy attributes
- [ ] ✅ Always retry until timeout (Cypress auto-retries most commands)

### Async Pattern
```javascript
// ✅ CORRECT: Wait for async operation to complete
cy.get('[data-cy=form]').submit();
cy.get('[data-cy=success]', { timeout: TIMEOUTS.long }).should('exist');

// ❌ WRONG: Assume immediate completion
cy.get('[data-cy=form]').submit();
cy.get('[data-cy=success]').should('exist');
// May fail: AJAX still pending
```

---

## 📱 Mobile/Responsive

- [ ] Test works at `cy.viewport(375, 667)` (mobile)
- [ ] Test works at `cy.viewport(768, 1024)` (tablet)
- [ ] Test works at `cy.viewport(1920, 1080)` (desktop)
- [ ] Selectors account for responsive layout (e.g., `#mobileMenu` vs `#desktopNav`)

---

## ✅ Final Review (Before PR)

### Functionality
- [ ] Test passes locally 5+ times (reproducible)
- [ ] Test fails if code changes (i.e., actually tests something)
- [ ] Test passes on clean environment (no side effects)
- [ ] No hardcoded credentials or test IDs
- [ ] Error messages helpful for debugging

### Code Quality
- [ ] No duplication (helpers extracted)
- [ ] No unnecessary comments (only "why", not "what")
- [ ] Constants over magic values
- [ ] Clear variable names (not `x`, `el`, `res`)
- [ ] Proper indentation (2 spaces)

### Performance
- [ ] Timeouts not excessive (e.g., `TIMEOUTS.long` for every get)
- [ ] Sessions reused (not re-login each test)
- [ ] Helpers optimized (no unnecessary queries)
- [ ] Test runs under 10 seconds (if simple)

---

## 🐛 Debugging a Flaky Test

1. **Run locally 10 times**: `for i in {1..10}; do npm run cy:run; done`
2. **Check timeouts**: All `.get()` have explicit `{ timeout }`?
3. **Check waits**: After `.click()`, is next assertion waiting for result?
4. **Check selectors**: Does selector exist in real app? Use `cy.debug()`
5. **Check async**: Is there an AJAX/animation? Need longer timeout?
6. **Screenshots**: `npm run cy:run -- --headed` to watch execution

---

## 📊 Test Organization Examples

### ✅ Good Structure
```javascript
// Group by feature
describe('Login flow', () => {
  it('logs in with valid credentials', () => {});
  it('shows error with invalid password', () => {});
  it('logs out successfully', () => {});
});

describe('Grid navigation', () => {
  beforeEach(() => loginAsTestUser());
  it('displays Company grid', () => {});
  it('searches grid', () => {});
});
```

### ❌ Bad Structure
```javascript
// Mixing unrelated tests
describe('My Tests', () => {
  it('login', () => {});
  it('grid', () => {});
  it('admin panel', () => {}); // Too broad
});

// Mega-test (test 5 things at once)
it('does everything', () => {
  cy.visit('/login');
  cy.get('[data-cy=username]').type('test');
  // ... 50 more lines ...
  cy.get('[data-cy=grid]').should('exist');
  cy.get('[data-cy=add]').click();
  // ... and so on
});
```

---

## 🚀 Running Tests

```bash
# Interactive (UI mode, best for debugging)
npm run cy:open

# All tests headless
npm run cy:run

# Specific file only
npm run cy:run -- --spec "cypress/e2e/login.cy.js"

# Headed mode (see browser)
npm run cy:run -- --headed

# Debug first failure
npm run cy:run -- --browser chrome --debug
```

---

## 📋 Common Assertions Patterns

```javascript
// Existence
cy.get('[data-cy=button]').should('exist');
cy.get('[data-cy=button]').should('not.exist');

// Visibility
cy.get('[data-cy=button]').should('be.visible');
cy.get('[data-cy=button]').should('not.be.visible');

// State
cy.get('[data-cy=button]').should('be.disabled');
cy.get('[data-cy=button]').should('not.be.disabled');

// Content
cy.get('[data-cy=title]').should('contain.text', 'Company');
cy.get('[data-cy=count]').should('have.text', '42');

// Attributes
cy.get('input[data-cy=email]').should('have.value', 'test@example.com');
cy.get('a[data-cy=link]').should('have.attr', 'href', '/admin');

// Navigation
cy.url().should('include', '/dashboard.php');
cy.url().should('not.include', '/login.php');

// Length
cy.get('tr').should('have.length', 5);
cy.get('.menu-item').should('have.length.greaterThan', 3);
```

---

## 🔐 Security Checklist

- [ ] No plaintext passwords in test code → use env vars or config
- [ ] No hardcoded user IDs or test data IDs
- [ ] Test user account marked as test-only (not admin)
- [ ] No sensitive data logged in Cypress console
- [ ] Screenshot data excluded from CI artifacts if needed

---

## 📚 Related Files

- **Main Guidelines:** `TESTING_GUIDELINES.md` (comprehensive reference)
- **Cypress Config:** `cypress.config.js`
- **Login Tests:** `cypress/e2e/login.cy.js`
- **Admin Tests:** `cypress/e2e/admin.cy.js`
- **Package:** `package.json` (Cypress 13.x)

---

**Last Updated:** 2026-05-17
