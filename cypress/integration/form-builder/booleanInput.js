describe('@sanity/form-builder: BooleanInput', () => {
  it('should have a height of 35px if no description', () => {
    cy.visit('/test/desk/input-standard;booleansTest;bd99e58a-845f-4d52-b54a-56a9b7af3be1')

    cy.getField('switchIndeterminate2').invoke('outerHeight').should('be.eq', 35)
  })
})
