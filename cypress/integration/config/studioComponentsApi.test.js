describe('Config: studio components', () => {
  beforeEach(() => {
    cy.visit('custom-components/content')
  })

  describe('defineConfig', () => {
    it('default layout is displayed inside renderLayout component', () => {
      cy.get('[data-testid="test-layout-config"]')
        .find('[data-testid="studio-layout"]')
        .should('be.visible')
    })

    it('logo is displayed with context value from renderLayout', () => {
      cy.get('[data-testid="logo"]').contains('Context value')
    })

    it('default navbar is displayed with banner from renderNavbar', () => {
      cy.get('[data-testid="test-navbar-config"]')
        .find('[data-testid="test-navbar-banner-config"]')
        .should('be.visible')
      cy.get('[data-testid="test-navbar-config"]')
        .find('[data-testid="navbar"]')
        .should('be.visible')
    })

    it('default tool menu is displayed inside renderToolMenu component', () => {
      cy.get('[data-testid="test-tool-menu-config"]')
        .find('[data-testid="tool-collapse-menu"]')
        .should('be.visible')
    })
  })

  describe('createPlugin', () => {
    it('custom layout in defineConfig is displayed inside renderLayout component', () => {
      cy.get('[data-testid="test-layout-plugin"]')
        .find('[data-testid="test-layout-config"]')
        .find('[data-testid="studio-layout"]')
        .should('be.visible')
    })

    it('custom navbar in defineConfig is displayed inside renderNavbar component', () => {
      cy.get('[data-testid="test-navbar-plugin"]')
        .find('[data-testid="test-navbar-config"]')
        .find('[data-testid="navbar"]')
        .should('be.visible')
    })

    it('custom tool menu in defineConfig is displayed inside renderToolMenu component', () => {
      cy.get('[data-testid="test-tool-menu-plugin"]')
        .find('[data-testid="test-tool-menu-config"]')
        .find('[data-testid="tool-collapse-menu"]')
        .should('be.visible')
    })
  })
})
