describe('Studio config: components API', () => {
  beforeEach(() => {
    cy.visit('/custom-components/content')
  })

  // createConfig
  describe('createConfig', () => {
    it('custom Layout in createConfig is displayed with default Layout', () => {
      cy.get('[data-testid="custom-layout-config"]')
        .find('[data-testid="studio-layout"]')
        .should('be.visible')
    })

    it('custom Logo in createConfig is displayed with value from context in custom Layout', () => {
      cy.get('[data-testid="navbar-root-link"]')
        .find('[data-testid="custom-logo-config"]')
        .should('be.visible')

      cy.get('[data-testid="navbar-root-link"]')
        .find('[data-testid="custom-logo-config"]')
        .contains('Text from context')
    })

    it('custom Navbar in createConfig is displayed with default Navbar', () => {
      cy.get('[data-testid="custom-navbar-config"]')
        .find('[data-testid="navbar"]')
        .should('be.visible')
    })

    it('custom ToolMenu in createConfig is displayed with default ToolMenu', () => {
      cy.get('[data-testid="custom-tool-menu-config"]')
        .find('[data-testid="tool-collapse-menu"]')
        .should('be.visible')
    })
  })

  // createPlugin
  describe('createPlugin', () => {
    it('custom Layout in createPlugin is displayed with Layout in createConfig', () => {
      cy.get('[data-testid="custom-layout-plugin"]')
        .find('[data-testid="custom-layout-config"]')
        .find('[data-testid="studio-layout"]')
        .should('be.visible')
    })

    it('custom Logo in createPlugin is displayed with Logo in createConfig', () => {
      cy.get('[data-testid="navbar-root-link"]')
        .find('[data-testid="custom-logo-plugin"]')
        .find('[data-testid="custom-logo-config"]')
        .should('be.visible')

      cy.get('[data-testid="navbar-root-link"]')
        .find('[data-testid="custom-logo-plugin"]')
        .find('[data-testid="custom-logo-config"]')
        .contains('Text from context')
    })

    it('custom Navbar in createPlugin is displayed with Navbar in createConfig', () => {
      cy.get('[data-testid="custom-navbar-plugin"]')
        .find('[data-testid="custom-navbar-config"]')
        .find('[data-testid="navbar"]')
        .should('be.visible')
    })

    it('custom ToolMenu in createPlugin is displayed with ToolMenu in createConfig', () => {
      cy.get('[data-testid="custom-tool-menu-plugin"]')
        .find('[data-testid="custom-tool-menu-config"]')
        .find('[data-testid="tool-collapse-menu"]')
        .should('be.visible')
    })
  })

  // createPlugin with plugins
  describe('createPlugin with plugins', () => {
    it('custom Layout in createPlugin is displayed with Layout in plugin', () => {
      cy.get('[data-testid="custom-layout-plugin-2"]')
        .find('[data-testid="custom-layout-plugin"]')
        .find('[data-testid="custom-layout-config"]')
        .find('[data-testid="studio-layout"]')
        .should('be.visible')
    })

    it('custom Logo in createPlugin is displayed with Logo in plugin', () => {
      cy.get('[data-testid="navbar-root-link"]')
        .find('[data-testid="custom-logo-plugin-2"]')
        .find('[data-testid="custom-logo-plugin"]')
        .find('[data-testid="custom-logo-config"]')
        .should('be.visible')

      cy.get('[data-testid="navbar-root-link"]')
        .find('[data-testid="custom-logo-plugin-2"]')
        .find('[data-testid="custom-logo-plugin"]')
        .find('[data-testid="custom-logo-config"]')
        .contains('Text from context')
    })

    it('custom Navbar in createPlugin is displayed with Navbar in plugin', () => {
      cy.get('[data-testid="custom-navbar-plugin-2"]')
        .find('[data-testid="custom-navbar-plugin"]')
        .find('[data-testid="custom-navbar-config"]')
        .find('[data-testid="navbar"]')
        .should('be.visible')
    })

    it('custom ToolMenu in createPlugin is displayed with ToolMenu in plugin', () => {
      cy.get('[data-testid="custom-tool-menu-plugin-2"]')
        .find('[data-testid="custom-tool-menu-plugin"]')
        .find('[data-testid="custom-tool-menu-config"]')
        .find('[data-testid="tool-collapse-menu"]')
        .should('be.visible')
    })
  })
})
