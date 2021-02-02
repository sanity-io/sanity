describe('BooleanInput', () => {
  it('should have a height of 35px if no description', () => {
    cy.visit('/desk/booleans;6e1a054a-04c1-4901-9a76-5bc669c1eb4e')

    cy.getField('on').invoke('outerHeight').should('be.eq', 35)
  })
})
