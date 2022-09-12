describe('Config: components API', () => {
  beforeEach(() => {
    cy.visit('custom-components/content')
  })

  it('default layout is displayed inside renderLayout component', () => {
    cy.get('[data-testid="custom-studio-layout"]')
      .find('[data-testid="studio-layout"]')
      .should('be.visible')
  })

  it('default tool menu is displayed inside renderToolMenu component', () => {
    cy.get('[data-testid="custom-tool-menu"]')
      .find('[data-testid="tool-collapse-menu"]')
      .should('be.visible')
  })

  it('custom logo is displayed using renderLogo with context value from renderLayout', () => {
    cy.get('[data-testid="custom-logo"]').contains('Context value')
  })
})
