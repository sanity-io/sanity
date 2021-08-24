describe('@sanity/default-layout: Navbar', () => {
  it('should render ActionModal on top of Desk Tool’s pane headers', () => {
    cy.visit('/test/desk')

    cy.get('[data-testid="default-layout-global-create-button"]').click()

    cy.get('[data-testid="default-layout-global-create-dialog"]').should(
      'have.css',
      'z-index',
      '500801'
    )

    cy.get('[data-testid="desk-tool-list-pane"] [data-testid="pane-header"]').should(
      'have.css',
      'z-index',
      '101'
    )
  })
})
