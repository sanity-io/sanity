import {uuid} from '@sanity/uuid'
import client from '../../helpers/sanityClientSetUp'

const docId = `drafts.${uuid()}`

const doc = {
  _id: docId,
  _type: 'validationCI',
  errorString: '',
  warningString: '',
  infoString: '',
}

/** Each fields validation rule is configured with min(5) */
const VALID_VALUE = 'String longer than 5'
const INVALID_VALUE = 'abc'

function patchDocument(payload) {
  return client.patch(docId).set(payload).commit({visibility: 'async'})
}

describe('@sanity/form-builder: Validation', () => {
  before(async () => {
    cy.viewport(1000, 1500)
    await client.create(doc, {visibility: 'async'})
  })

  beforeEach(() => {
    cy.visit(`/test/desk/input-ci;validationCI;${docId}%2Ctemplate%3DvalidationCI`)
  })

  /** Error */
  it('when there are validation errors, the publish button is disabled', () => {
    cy.wrap(patchDocument({errorString: INVALID_VALUE})).then(() => {
      cy.get('[data-testid="action-Publish"]').should('have.attr', 'disabled')
    })
  })

  it('when there are validation errors, the error icon is visible', () => {
    cy.get('[data-testid="input-errorString"]')
      .find('[data-testid="input-validation-icon-error"]')
      .should('be.visible')
  })

  it('when there are no validation errors, the publish button is enabled', () => {
    cy.wrap(patchDocument({errorString: VALID_VALUE})).then(() => {
      cy.get('[data-testid="action-Publish"]').should('not.have.attr', 'disabled')
    })
  })

  it('when there are no validation errors, the error icon is hidden', () => {
    cy.get('[data-testid="input-errorString"]')
      .find('[data-testid="input-validation-icon-error"]')
      .should('not.exist')
  })

  /** Warning */
  it('when there are validation warnings, the publish button is enabled', () => {
    cy.wrap(patchDocument({warningString: INVALID_VALUE})).then(() => {
      cy.get('[data-testid="action-Publish"]').should('not.have.attr', 'disabled')
    })
  })

  it('when there are validation warnings, the warning icon is visible', () => {
    cy.get('[data-testid="input-warningString"]')
      .find('[data-testid="input-validation-icon-warning"]')
      .should('be.visible')
  })

  it('when there are no validation warnings, the warning icon is hidden', () => {
    cy.wrap(patchDocument({warningString: VALID_VALUE})).then(() => {
      cy.get('[data-testid="input-warningString"]')
        .find('[data-testid="input-validation-icon-warning"]')
        .should('not.exist')
    })
  })

  /** Info */
  it('when there are validation infos, the publish button is enabled', () => {
    cy.wrap(patchDocument({infoString: INVALID_VALUE})).then(() => {
      cy.get('[data-testid="action-Publish"]').should('not.have.attr', 'disabled')
    })
  })

  it('when there are validation infos, the info icon is visible', () => {
    cy.get('[data-testid="input-infoString"]')
      .find('[data-testid="input-validation-icon-info"]')
      .should('be.visible')
  })

  it('when there are no validation infos, the info icon is hidden', () => {
    cy.wrap(patchDocument({infoString: VALID_VALUE})).then(() => {
      cy.get('[data-testid="input-infoString"]')
        .find('[data-testid="input-validation-icon-info"]')
        .should('not.exist')
    })
  })

  after(async () => {
    await client.delete(docId, {visibility: 'async'})
  })
})
