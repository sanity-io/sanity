describe('@sanity/desk-tool: publish permission', () => {
  it('as an administrator user, the publish button will be active', () => {
    cy.visit(
      '/test/desk/input-standard;booleansTest;1053af2f-84af-49a1-b42b-e2156470bb77%2Ctemplate%3DbooleansTest#_debug_roles=administrator'
    )

    // as the publish button works right now, unless changes are made to the document once opened, the button will always be disaled
    // this is expected behaviour for now.

    cy.get('#21').click({force: true})
    cy.get('#21').click({force: true})

    cy.get('[data-testid=action-Publish]').should('not.have.attr', 'disabled')
  })

  it('as an restricted user, the publish button will be disabled', () => {
    cy.visit(
      '/test/desk/input-standard;booleansTest;1053af2f-84af-49a1-b42b-e2156470bb77%2Ctemplate%3DbooleansTest#_debug_roles=restricted'
    )

    // this whole document will be disabled and is outside of the scope of this test

    cy.get('[data-testid=action-Publish]').should('have.attr', 'disabled')
  })

  it('as a requiresApproval user on an approved published document, the publish button will be active', () => {
    cy.visit(
      '/test/desk/author;914bcbf4-9ead-4be1-b797-8d2995c50380%2Ctemplate%3Dauthor-unlocked#_debug_roles=requiresApproval'
    )

    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(4500)

    // as the publish button works right now, unless changes are made to the document once opened, the button will always be disaled
    // this is expected behaviour for now.
    cy.get('input', {wait: 4000}).eq(1).type(' ')

    cy.get('[data-testid=action-Publish]').should('not.have.attr', 'disabled')
  })

  it('as a requiresApproval user on a non-approved document, the publish button will be disabled', () => {
    cy.visit(
      '/test/desk/input-standard;booleansTest;1053af2f-84af-49a1-b42b-e2156470bb77%2Ctemplate%3DbooleansTest#_debug_roles=requiresApproval'
    )

    // this whole document will be disabled and is outside of the scope of this test

    cy.get('[data-testid=action-Publish]').should('have.attr', 'disabled')
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

  it('as an restricted user, the duplicate button will be disabled', () => {
    cy.visit(
      '/test/desk/input-standard;booleansTest;1053af2f-84af-49a1-b42b-e2156470bb77%2Ctemplate%3DbooleansTest#_debug_roles=restricted'
    )

    cy.get('[data-testid=action-menu-button').click()
    cy.get('[data-testid=action-Duplicate]').should('have.attr', 'disabled')
  })

  it('as a requiresApproval user on an approved published document, the duplicate button will be active', () => {
    cy.visit(
      '/test/desk/author;914bcbf4-9ead-4be1-b797-8d2995c50380%2Ctemplate%3Dauthor-unlocked#_debug_roles=requiresApproval'
    )

    cy.get('[data-testid=action-menu-button').click()
    cy.get('[data-testid=action-Duplicate]').should('not.have.attr', 'disabled')
  })

  it('as a requiresApproval user on a non-approved document, the duplicate button will be disabled', () => {
    cy.visit(
      '/test/desk/input-standard;booleansTest;1053af2f-84af-49a1-b42b-e2156470bb77%2Ctemplate%3DbooleansTest#_debug_roles=requiresApproval'
    )

    cy.get('[data-testid=action-menu-button').click()
    cy.get('[data-testid=action-Duplicate]').should('have.attr', 'disabled')
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

  it('as an restricted user, the duplicate button will be disabled', () => {
    cy.visit(
      '/test/desk/input-standard;booleansTest;1053af2f-84af-49a1-b42b-e2156470bb77%2Ctemplate%3DbooleansTest#_debug_roles=restricted'
    )

    cy.get('[data-testid=action-menu-button').click()
    cy.get('[data-testid=action-Delete]').should('have.attr', 'disabled')
  })

  it('as a requiresApproval user on an approved published document, the duplicate button will be active', () => {
    cy.visit(
      '/test/desk/author;914bcbf4-9ead-4be1-b797-8d2995c50380%2Ctemplate%3Dauthor-unlocked#_debug_roles=requiresApproval'
    )

    cy.get('[data-testid=action-menu-button').click()
    cy.get('[data-testid=action-Delete]').should('not.have.attr', 'disabled')
  })

  it('as a requiresApproval user on a non-approved document, the duplicate button will be disabled', () => {
    cy.visit(
      '/test/desk/input-standard;booleansTest;1053af2f-84af-49a1-b42b-e2156470bb77%2Ctemplate%3DbooleansTest#_debug_roles=requiresApproval'
    )

    cy.get('[data-testid=action-menu-button').click()
    cy.get('[data-testid=action-Delete]').should('have.attr', 'disabled')
  })
})
