describe('Config: studio components', () => {
  beforeEach(() => {
    cy.visit('custom-components/content')
  })

  describe('defineConfig', () => {
    it('config layout > default layout', () => {
      cy.get('[data-testid="test-layout-config"]')
        .find('[data-testid="studio-layout"]')
        .should('be.visible')
    })

    it('custom logo component displays context value from custom layout', () => {
      cy.get('[data-testid="logo"]').contains('Context value')
    })

    it('default navbar is displayed with custom banner', () => {
      cy.get('[data-testid="test-navbar-config"]')
        .find('[data-testid="test-navbar-banner-config"]')
        .should('be.visible')
      cy.get('[data-testid="test-navbar-config"]')
        .find('[data-testid="navbar"]')
        .should('be.visible')
    })

    it('config tool menu > default tool menu', () => {
      cy.get('[data-testid="test-tool-menu-config"]')
        .find('[data-testid="tool-collapse-menu"]')
        .should('be.visible')
    })
  })

  describe('createPlugin', () => {
    it('config layout component > plugin layout component > default layout', () => {
      cy.get('[data-testid="test-layout-config"]')
        .find('[data-testid="test-layout-plugin"]')
        .find('[data-testid="studio-layout"]')
        .should('be.visible')
    })

    it('config navbar component > plugin navbar > default navbar', () => {
      cy.get('[data-testid="test-navbar-config"]')
        .find('[data-testid="test-navbar-plugin"]')
        .find('[data-testid="navbar"]')
        .should('be.visible')
    })

    it('config tool menu > plugin tool menu > default tool menu', () => {
      cy.get('[data-testid="test-tool-menu-config"]')
        .find('[data-testid="test-tool-menu-plugin"]')
        .find('[data-testid="tool-collapse-menu"]')
        .should('be.visible')
    })
  })
})
