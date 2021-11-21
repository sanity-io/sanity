describe('@sanity/desk-tool: when a single action exists on the header, which permissions exist', () => {
  it('when the user is admin: the create button is active', () => {
    cy.visit('/test/desk/custom;deep;book#_debug_roles=administrator')

    cy.get('[data-testid=action-intent-button]').should('not.have.attr', 'disabled')
  })

  it('when the user is viewer (read only): the create button is disabled', () => {
    cy.visit('/test/desk/custom;deep;book#_debug_roles=viewer')

    cy.get('[data-testid=action-intent-button]').should('have.attr', 'disabled')
  })
})

describe('@sanity/desk-tool: when multiple actions exist on the header, which permissions exist', () => {
  it('when the user is admin: all actions are enabled', () => {
    cy.visit('/test/desk/author#_debug_roles=requiresApproval')

    cy.get('[data-testid=multi-action-intent-button]').click()

    cy.get('[data-testid=action-intent-button-0').should('have.attr', 'disabled')
    cy.get('[data-testid=action-intent-button-1').should('have.attr', 'disabled')
    cy.get('[data-testid=action-intent-button-2').should('not.have.attr', 'disabled') // the only menu is affected by the locked property
  })

  it('when the user is requiresApproval (based on schema property): only the last action is enabled', () => {
    cy.visit('/test/desk/author#_debug_roles=requiresApproval')

    cy.get('[data-testid=multi-action-intent-button]').click()

    cy.get('[data-testid=action-intent-button-0').should('have.attr', 'disabled')
    cy.get('[data-testid=action-intent-button-1').should('have.attr', 'disabled')
    cy.get('[data-testid=action-intent-button-2').should('not.have.attr', 'disabled') // the only menu is affected by the locked property
  })

  it('when the user is viewer (read only): all the actions are disabled', () => {
    cy.visit('/test/desk/author#_debug_roles=viewer')

    cy.get('[data-testid=action-intent-button]').should('have.attr', 'disabled')
  })
})
