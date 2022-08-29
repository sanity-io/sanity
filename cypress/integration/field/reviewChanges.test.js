import {uuid} from '@sanity/uuid'
import client from '../../helpers/sanityClientSetUp'

const DOC_ID = `drafts.${uuid()}`

const doc = {
  _id: DOC_ID,
  _type: 'reviewChanges',
  stringWithDefaultDiffComponent: undefined,
  stringWithCustomDiffComponent: undefined,
  stringWithRenderDiffComponent: undefined,
  numberWithDefaultDiffComponent: undefined,
  numberWithCustomDiffComponent: undefined,
  numberWithRenderDiffComponent: undefined,
  booleanWithDefaultDiffComponent: undefined,
  booleanWithCustomDiffComponent: undefined,
  booleanWithRenderDiffComponent: undefined,
  slugWithDefaultDiffComponent: undefined,
  slugWithCustomDiffComponent: undefined,
  slugWithRenderDiffComponent: undefined,
}

function patchDocument(payload) {
  return client.patch(DOC_ID).set(payload).commit({visibility: 'async'})
}

describe('@sanity/field: Review changes', () => {
  before(async () => {
    await client.create(doc, {visibility: 'async'})
  })

  beforeEach(() => {
    cy.visit(
      `/test/content/input-ci;reviewChanges;${DOC_ID}%2Ctemplate%3DreviewChanges%2Csince%3D%40lastPublished`
    )
    cy.viewport(1500, 3500)
  })

  it('panel is visible', () => {
    cy.get('[data-testid="review-changes-pane"]').should('be.visible')
  })

  it('no changes message visible', () => {
    cy.get('[data-testid="review-changes-no-changes-message"]').should('be.visible')
  })

  it('default diff is visible', () => {
    cy.wrap(
      patchDocument({
        booleanWithDefaultDiffComponent: true,
        numberWithDefaultDiffComponent: 1,
        slugWithDefaultDiffComponent: {
          current: 'slug',
        },
        stringWithDefaultDiffComponent: 'Hello world',
      })
    ).then(() => {
      cy.get('[data-testid="string-field-diff"]').should('be.visible')
      cy.get('[data-testid="boolean-field-diff"]').should('be.visible')
      cy.get('[data-testid="slug-field-diff"]').should('be.visible')
      cy.get('[data-testid="number-field-diff"]').should('be.visible')
    })
  })

  // Configured in the reviewChanges schema
  it('components.diff is visible', () => {
    cy.wrap(
      patchDocument({
        booleanWithCustomDiffComponent: true,
        numberWithCustomDiffComponent: 1,
        slugWithCustomDiffComponent: {
          current: 'slug',
        },
        stringWithCustomDiffComponent: 'Hello world',
      })
    ).then(() => {
      cy.get('[data-testid="custom-string-diff"]')
        .find('[data-testid="string-field-diff"]')
        .should('be.visible')

      cy.get('[data-testid="custom-boolean-diff"]')
        .find('[data-testid="boolean-field-diff"]')
        .should('be.visible')

      cy.get('[data-testid="custom-slug-diff"]')
        .find('[data-testid="slug-field-diff"]')
        .should('be.visible')

      cy.get('[data-testid="custom-number-diff"]')
        .find('[data-testid="number-field-diff"]')
        .should('be.visible')
    })
  })

  // Configured in the reviewChangesTest plugin
  it('form.renderDiff diff is visible', () => {
    cy.wrap(
      patchDocument({
        booleanWithRenderDiffComponent: true,
        numberWithRenderDiffComponent: 1,
        slugWithRenderDiffComponent: {
          current: 'slug',
        },
        stringWithRenderDiffComponent: 'Hello world',
      })
    ).then(() => {
      cy.get('[data-testid="render-diff-string"]')
        .find('[data-testid="string-field-diff"]')
        .should('be.visible')

      cy.get('[data-testid="render-diff-boolean"]')
        .find('[data-testid="boolean-field-diff"]')
        .should('be.visible')

      cy.get('[data-testid="render-diff-slug"]')
        .find('[data-testid="slug-field-diff"]')
        .should('be.visible')

      cy.get('[data-testid="render-diff-number"]')
        .find('[data-testid="number-field-diff"]')
        .should('be.visible')
    })
  })

  after(async () => {
    await client.delete(DOC_ID, {visibility: 'async'})
  })
})
