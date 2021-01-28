describe('DocumentCommands', () => {
  it('should be able to create, publish and navigate to a document', () => {
    cy.createAndPublishDocument('booleansTest').then((createdDocumentId) => {
      cy.visit('/')

      cy.navigateToDocument(createdDocumentId)

      cy.url().should('contain', createdDocumentId)

      cy.visit('/')

      cy.wait(1000)

      //cy.get('#sanity').should('contain', createdDocumentId)

      cy.deleteDocument(createdDocumentId)

      cy.wait(1000)

      cy.visit('/')

      //cy.get('#sanity').should('not.contain', createdDocumentId)
    })
  })
})
