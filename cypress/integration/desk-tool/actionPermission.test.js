describe('@sanity/desk-tool: publish permission', () => {
  it('as an administrator user, the publish button will be active', () => {
    cy.visit(
      '/test/desk/input-standard;booleansTest;1053af2f-84af-49a1-b42b-e2156470bb77%2Ctemplate%3DbooleansTest#_debug_roles=administrator'
    )

    // as the publish button works right now, unless changes are made to the document once opened, the button will always be disaled
    // this is expected behaviour for now.

    cy.get('[data-testid=input-switchTest] input[type=checkbox]').click({force: true})
    cy.get('[data-testid=input-switchTest] input[type=checkbox]').click({force: true})

    cy.get('[data-testid=action-Publish]').should('not.have.attr', 'disabled')
  })
})

describe('@sanity/desk-tool: duplicate permission', () => {
  it('as an administrator user, the duplicate button will be active', () => {
    cy.visit(
      '/test/desk/input-standard;booleansTest;1053af2f-84af-49a1-b42b-e2156470bb77%2Ctemplate%3DbooleansTest#_debug_roles=administrator'
    )

    cy.get('[data-testid=action-menu-button').click()
    cy.get('[data-testid=action-Duplicate]').should('not.have.attr', 'disabled')
  })
})

describe('@sanity/desk-tool: delete permission', () => {
  it('as an administrator user, the duplicate button will be active', () => {
    cy.visit(
      '/test/desk/input-standard;booleansTest;1053af2f-84af-49a1-b42b-e2156470bb77%2Ctemplate%3DbooleansTest#_debug_roles=administrator'
    )

    cy.get('[data-testid=action-menu-button').click()
    cy.get('[data-testid=action-Delete]').should('not.have.attr', 'disabled')
  })
})

describe('@sanity/desk-tool: unpublish permission', () => {
  it('as an administrator user, the unpublish button will be active', () => {
    cy.visit(
      '/test/desk/input-standard;booleansTest;1053af2f-84af-49a1-b42b-e2156470bb77%2Ctemplate%3DbooleansTest#_debug_roles=administrator'
    )

    cy.get('[data-testid=action-menu-button').click()
    cy.get('[data-testid=action-Unpublish]').should('not.have.attr', 'disabled')
  })
})

describe('@sanity/desk-tool: discardDraft permission', () => {
  it('as an administrator user, the discard changes button will be active', () => {
    cy.visit(
      '/test/desk/input-standard;booleansTest;1053af2f-84af-49a1-b42b-e2156470bb77%2Ctemplate%3DbooleansTest#_debug_roles=administrator'
    )

    cy.get('[data-testid=action-menu-button').click()
    cy.get('[data-testid=action-Discardchanges]').should('not.have.attr', 'disabled')
  })
})
