describe('@sanity/default-layout: Navbar', () => {
  it('should render ActionModal on top of Desk Tool’s pane headers', () => {
    cy.visit('/desk')

    cy.get('[data-test="default-layout-global-create-button"]').click()

    cy.get('[data-test="default-layout-global-create-dialog"]').should(
      'have.css',
      'z-index',
      '500401'
    )

    cy.get('[data-test="desk-tool-list-pane"] [data-test="components-default-pane-header"]').should(
      'have.css',
      'z-index',
      '101'
    )
  })
})
