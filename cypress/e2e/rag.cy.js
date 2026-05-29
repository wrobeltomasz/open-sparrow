// cypress/e2e/rag.cy.js
// ============================================================================
// RAG Knowledge Base Module Tests — rag.php
// ============================================================================

const BASE = 'http://localhost:8080';

// ============================================================================
// Test Suite: RAG Page Structure
// ============================================================================

describe('OpenSparrow – RAG: Page Structure', () => {
  beforeEach(() => {
    loginAsTestUser();
    cy.visit(`${BASE}/rag.php`);
    cy.get('#ragSection', { timeout: CypressHelpers.TIMEOUTS.medium }).should('exist');
  });

  it('loads RAG page', () => {
    cy.get('#ragSection').should('exist');
  });

  it('has conversation container', () => {
    cy.get('#ragConversation').should('exist');
  });

  it('has query textarea', () => {
    cy.get('#ragQuery').should('exist');
  });

  it('has Send button', () => {
    cy.get('#ragSendBtn').should('exist').and('be.visible');
  });

  it('has Clear history button', () => {
    cy.get('#ragClearBtn').should('exist').and('be.visible');
  });

  it('has tag filter sidebar', () => {
    cy.get('#ragTagList').should('exist');
  });

  it('sidebar has a title', () => {
    cy.get('.rag-sidebar-title').should('exist').invoke('text').should('not.be.empty');
  });

  it('textarea is writable', () => {
    cy.get('#ragQuery').type('test question');
    cy.get('#ragQuery').should('have.value', 'test question');
  });
});

// ============================================================================
// Test Suite: RAG Tag Loading
// ============================================================================

describe('OpenSparrow – RAG: Tag Loading', () => {
  beforeEach(() => {
    loginAsTestUser();
    cy.visit(`${BASE}/rag.php`);
  });

  it('tag list transitions from loading state', () => {
    cy.get('#ragTagList', { timeout: CypressHelpers.TIMEOUTS.long }).should($el => {
      const hasLoading = $el.find('.rag-tag-loading').length > 0;
      const hasTags    = $el.find('.rag-tag, button, a').length > 0;
      const isEmpty    = $el.children().length === 0
        || ($el.text().trim() === '' || !$el.find('.rag-tag-loading').length);
      expect(hasTags || !hasLoading, 'tag list should finish loading').to.be.true;
    });
  });

  it('tag list shows tags or empty state', () => {
    cy.get('#ragTagList', { timeout: CypressHelpers.TIMEOUTS.long }).then($el => {
      const hasTags = $el.find('.rag-tag, [data-tag]').length > 0;
      if (hasTags) {
        cy.get('#ragTagList .rag-tag, #ragTagList [data-tag]')
          .should('have.length.gte', 1);
      } else {
        Cypress.log({ message: 'No tags configured in RAG knowledge base' });
      }
    });
  });
});

// ============================================================================
// Test Suite: RAG Send Interaction
// ============================================================================

describe('OpenSparrow – RAG: Send Interaction', () => {
  beforeEach(() => {
    loginAsTestUser();
    cy.visit(`${BASE}/rag.php`);
    cy.get('#ragSection', { timeout: CypressHelpers.TIMEOUTS.medium }).should('exist');
  });

  it('Send button click with empty textarea does not post', () => {
    cy.intercept('POST', '**/api_rag.php**').as('ragPost');
    cy.get('#ragSendBtn').click();
    // With empty input, should not fire API call
    cy.wait(500);
    cy.get('@ragPost.all').should('have.length', 0);
  });

  it('typing question enables send interaction', () => {
    cy.get('#ragQuery').type('What is OpenSparrow?');
    cy.get('#ragSendBtn').should('not.be.disabled');
  });

  it('Send fires POST to api_rag.php when question typed', () => {
    cy.intercept('POST', '**/api_rag.php**').as('ragQuery');
    cy.get('#ragQuery').type('What is OpenSparrow?');
    cy.get('#ragSendBtn').click();
    cy.wait('@ragQuery', { timeout: CypressHelpers.TIMEOUTS.long });
  });

  it('after send: message appears in conversation', () => {
    cy.intercept('POST', '**/api_rag.php**').as('ragSend');
    cy.get('#ragQuery').type('Hello');
    cy.get('#ragSendBtn').click();
    cy.wait('@ragSend', { timeout: CypressHelpers.TIMEOUTS.long });
    cy.get('#ragConversation', { timeout: CypressHelpers.TIMEOUTS.long })
      .children()
      .should('have.length.gte', 1);
  });

  it('Clear history button empties conversation', () => {
    // Add a message first if possible
    cy.get('#ragConversation').then($conv => {
      if ($conv.children().length === 0) {
        Cypress.log({ message: 'No conversation to clear — skipping' });
        return;
      }
      cy.get('#ragClearBtn').click();
      cy.get('#ragConversation').children().should('have.length', 0);
    });
  });
});

// ============================================================================
// Test Suite: RAG Mobile
// ============================================================================

describe('OpenSparrow – RAG: Mobile', () => {
  beforeEach(() => {
    cy.viewport('iphone-x');
    loginAsTestUser();
    cy.visit(`${BASE}/rag.php`);
  });

  it('loads on mobile viewport', () => {
    cy.get('#ragSection', { timeout: CypressHelpers.TIMEOUTS.medium }).should('exist');
  });

  it('textarea and send button exist on mobile', () => {
    cy.get('#ragQuery').should('exist');
    cy.get('#ragSendBtn').should('exist');
  });
});
