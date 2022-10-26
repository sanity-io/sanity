const TIMEOUT = 10000

describe('Config: form components', () => {
  beforeEach(() => {
    cy.visit('custom-components/content/v3;formComponentsApi;id')
    cy.viewport(1500, 2500)
  })

  describe('default field and input renders with customizations in config, plugin and schema', () => {
    it('boolean', () => {
      cy.get('[data-testid="field-plugin-component"]', {timeout: TIMEOUT})
        .find('[data-testid="field-config-component"]')
        .find('[data-testid="field-schema-boolean"]')
        .find('[data-testid="input-plugin-component"]')
        .find('[data-testid="input-config-component"]')
        .find('[data-testid="input-schema-boolean"]')
        .find('[data-testid="boolean-input"]')
        .should('be.visible')
    })

    it('string', () => {
      cy.get('[data-testid="field-plugin-component"]', {timeout: TIMEOUT})
        .find('[data-testid="field-config-component"]')
        .find('[data-testid="field-schema-string"]')
        .find('[data-testid="input-plugin-component"]')
        .find('[data-testid="input-config-component"]')
        .find('[data-testid="input-schema-string"]')
        .find('[data-testid="string-input"]')
        .should('be.visible')
    })

    it('reference', () => {
      cy.get('[data-testid="field-plugin-component"]', {timeout: TIMEOUT})
        .find('[data-testid="field-config-component"]')
        .find('[data-testid="field-schema-reference"]')
        .find('[data-testid="input-plugin-component"]')
        .find('[data-testid="input-config-component"]')
        .find('[data-testid="input-schema-reference"]')
        .find('[data-testid="reference-input"]')
        .should('be.visible')
    })

    it('image', () => {
      cy.get('[data-testid="field-plugin-component"]', {timeout: TIMEOUT})
        .find('[data-testid="field-config-component"]')
        .find('[data-testid="field-schema-image"]')
        .find('[data-testid="input-plugin-component"]')
        .find('[data-testid="input-config-component"]')
        .find('[data-testid="input-schema-image"]')
        .find('[data-testid="image-input"]')
        .should('be.visible')
    })

    it('array primitives', () => {
      cy.get('[data-testid="field-plugin-component"]', {timeout: TIMEOUT})
        .find('[data-testid="field-config-component"]')
        .find('[data-testid="field-schema-array-primitives"]')
        .find('[data-testid="input-plugin-component"]')
        .find('[data-testid="input-config-component"]')
        .find('[data-testid="input-schema-array-primitives"]')
        .find('[data-testid="array-primitives-input"]')
        .should('be.visible')

      cy.get('[data-testid="input-schema-array-primitives-custom-functions"]', {
        timeout: TIMEOUT,
      }).should('be.visible')
    })

    it('array', () => {
      cy.get('[data-testid="field-plugin-component"]', {timeout: TIMEOUT})
        .find('[data-testid="field-config-component"]')
        .find('[data-testid="field-schema-array-objects"]')
        .find('[data-testid="input-plugin-component"]')
        .find('[data-testid="input-config-component"]')
        .find('[data-testid="input-schema-array-objects"]')
        .find('[data-testid="array-input"]')
        .should('be.visible')
    })

    it('pte', () => {
      cy.get('[data-testid="field-plugin-component"]', {timeout: TIMEOUT})
        .find('[data-testid="field-config-component"]')
        .find('[data-testid="field-schema-pte"]')
        .find('[data-testid="input-plugin-component"]')
        .find('[data-testid="input-config-component"]')
        .find('[data-testid="input-schema-pte"]')
        .find('[data-testid="pt-editor"]')
        .should('be.visible')
    })
  })
})
