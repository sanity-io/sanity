describe('@sanity/default-layout: creating a document with an initial value template', () => {
  beforeEach(() => {
    cy.visit('test/desk')
    cy.get('[data-testid=default-layout-global-create-button]').click()
    cy.get('[data-testid=create-document-item-book-by-author').click()
  })

  it('will show the right url', () => {
    cy.url().should('include', '%2Ctemplate%3Dbook-by-author%2CeyJhdXRob3JJZCI6Imdycm0ifQ%3D%3D')
  })
})
