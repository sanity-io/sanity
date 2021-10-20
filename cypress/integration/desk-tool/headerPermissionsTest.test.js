describe('@sanity/desk-tool: header permissions', () => {
  it('is active if user has permissions', () => {
    cy.visit('/test/desk/custom;deep;book')

    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(1000)

    cy.get('[data-cy=action-intent-button]').should('not.have.attr', 'disabled')
  })

  it('are disabled if user is restricted (read only)', () => {
    cy.visit('/test/desk/custom;deep;book#_debug_roles=restricted')

    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(1000)

    cy.get('[data-cy=action-intent-button]').should('have.attr', 'disabled')
  })
})
