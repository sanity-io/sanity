describe('DatetimeInput react-datepicker popper', () => {
  beforeEach(() => {
    cy.visit(
      '/test/desk/datetimeTest%2Ctemplate%3DdatetimeTest;b44f31f5-2cb0-431b-a912-aba0e1bf46cd'
    )
  })

  it('should be rendered on top of array input dialog', () => {
    cy.getField('inArray').within(($field) => {
      cy.contains('Add').scrollIntoView().should('be.visible')
      cy.contains('Add').click()
    })

    cy.getField('date').within(($dateField) => {
      cy.get('button[title="Select date"]').click()
    })

    cy.get('.react-datepicker-popper').should('be.visible')
  })

  it('should be visible when clicking select date', () => {
    cy.getField('justDefaults').within(($field) => {
      cy.get('button[title="Select date"]').click()
    })

    cy.get('.react-datepicker-popper').should('be.visible')
  })
})
