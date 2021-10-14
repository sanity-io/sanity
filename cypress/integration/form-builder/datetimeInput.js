describe('@sanity/form-builder: DatetimeInput date-picker-dialog', () => {
  beforeEach(() => {
    cy.visit('/test/desk/input-standard;datetimeTest%2Ctemplate%3DdatetimeTest;ci-cypress')
  })

  it('should be rendered on top of array input dialog', () => {
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(1000)

    cy.getField('inArray').within(($field) => {
      cy.contains('Add').scrollIntoView().should('be.visible')
      cy.contains('Add').click()
    })

    cy.getField('date').within(($dateField) => {
      cy.get('button[data-testid="select-date-button"]').click()
    })

    cy.get('[data-testid="date-input-dialog"]').should('be.visible')

    cy.get('body').type('{esc}') // close the calendar dialog
    cy.get('body').type('{esc}') // close the array dialog
    // allow some time for the studio to flush pending mutations so that we submit the mutation removing the empty
    // array item on dialog close
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(1500)
  })

  it('should be visible when clicking select date', () => {
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(1000)

    cy.getField('justDefaults').within(($field) => {
      cy.get('button[data-testid="select-date-button"]').click()
    })

    cy.get('[data-testid="date-input-dialog"]').should('be.visible')
  })
})
