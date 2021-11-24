const el = (name) => `[data-testid="${name}"]`

describe('@sanity/form-builder: field groups', () => {
  it('should render group buttons', () => {
    cy.visit('/test/desk/input-debug;fieldGroups;c04d9594-b242-44ed-8da0-f6b5ff93f312')
    cy.get(el('field-groups')).should('be.visible')
    cy.get(el('group-all-fields')).should('be.visible').should('have.attr', 'aria-selected', 'true')

    cy.get(el('group-group1'))
      .should('be.visible')
      .click()
      .should('have.attr', 'aria-selected', 'true')
    cy.get(el('group-group1'))
      .should('be.visible')
      .click()
      .should('have.attr', 'aria-selected', 'true')
  })

  it('should filter field based on selected group', () => {
    cy.visit('/test/desk/input-debug;fieldGroups;c04d9594-b242-44ed-8da0-f6b5ff93f312')

    // Click on Group 1
    cy.get(el('group-group1')).click()
    cy.get(el('input-field1')).should('be.visible')
    cy.get(el('input-field2')).should('not.exist')
    cy.get(el('input-field3')).should('not.exist')
    cy.get(el('input-field4')).should('be.visible')

    // Click on group 2
    cy.get(el('group-group2')).click()
    cy.get(el('input-field1')).should('not.exist')
    cy.get(el('input-field2')).should('be.visible')
    cy.get(el('input-field3')).should('not.exist')
    cy.get(el('input-field4')).should('be.visible')
  })
})
