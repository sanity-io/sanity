describe('@sanity/desk-tool: test which header permissions exist', () => {
  it('when the user is admin: the create button is active', () => {
    cy.visit('/test/desk/custom;deep;book#_debug_roles=administrator')

    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(1000)

    cy.get('[data-testid=action-intent-button]').should('not.have.attr', 'disabled')
  })

  it('when the user is restricted (read only): the create button is disabled', () => {
    cy.visit('/test/desk/custom;deep;book#_debug_roles=restricted')

    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(1000)

    cy.get('[data-testid=action-intent-button]').should('have.attr', 'disabled')
  })

  it('when the user is requiresApproval (based on schema property): from the list of create (tooltip) only the last action is enabled', () => {
    cy.visit('/test/desk/author#_debug_roles=requiresApproval')

    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(1000)

    cy.get('[data-testid=multi-action-intent-button]').click()

    cy.get('[data-testid=action-intent-button-0').should('have.attr', 'disabled')
    cy.get('[data-testid=action-intent-button-1').should('have.attr', 'disabled')
    cy.get('[data-testid=action-intent-button-2').should('not.have.attr', 'disabled') // the only menu is affected by the locked property
  })
})
