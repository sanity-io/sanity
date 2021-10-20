describe('@sanity/desk-tool: header permissions', () => {
  it('is active if user has permissions', () => {
    cy.visit('/test/desk/custom;deep;book')

    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(1000)

    cy.get('[data-testid=action-intent-button]').should('not.have.attr', 'disabled')
  })

  it('are disabled if user is restricted (read only)', () => {
    cy.visit('/test/desk/custom;deep;book#_debug_roles=restricted')

    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(1000)

    cy.get('[data-testid=action-intent-button]').should('have.attr', 'disabled')
  })

  it('have only one action enabled because of the requiresApproval role based on schema property', () => {
    cy.visit('/test/desk/author#_debug_roles=requiresApproval')

    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(1000)

    cy.get('[data-testid=multi-action-intent-button]').click()

    cy.get('[data-testid=action-intent-button-0').should('have.attr', 'disabled')
    cy.get('[data-testid=action-intent-button-1').should('have.attr', 'disabled')
    cy.get('[data-testid=action-intent-button-2').should('not.have.attr', 'disabled') // the only menu is affected by the locked property
  })
})
