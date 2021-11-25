/* eslint-disable cypress/no-unnecessary-waiting */
import sanityClient from '@sanity/client'

const doc = {
  _type: 'conditionalFieldset',
  title: 'Conditional fieldset [Cypress]',
  hidden: true,
  readOnly: true,
  // Multi
  multiHiddenBooleanFalse1: 'Lorem',
  multiHiddenBooleanFalse2: 'Lorem',
  multiHiddenBooleanTrue1: 'Lorem',
  multiHiddenBooleanTrue2: 'Lorem',
  multiHiddenCallbackFalse1: 'Lorem',
  multiHiddenCallbackFalse2: 'Lorem',
  multiHiddenCallbackTrue1: 'Lorem',
  multiHiddenCallbackTrue2: 'Lorem',
  multiReadOnlyBooleanFalse1: 'Lorem',
  multiReadOnlyBooleanFalse2: 'Lorem',
  multiReadOnlyBooleanTrue1: 'Lorem',
  multiReadOnlyBooleanTrue2: 'Lorem',
  multiReadOnlyCallbackFalse1: 'Lorem',
  multiReadOnlyCallbackFalse2: 'Lorem',
  multiReadOnlyCallbackTrue1: 'Lorem',
  multiReadOnlyCallbackTrue2: 'Lorem',
  // Single
  singleHiddenBooleanFalse1: 'Lorem',
  singleHiddenBooleanTrue1: 'Lorem',
  singleHiddenCallbackFalse1: 'Lorem',
  singleHiddenCallbackTrue1: 'Lorem',
  singleReadOnlyBooleanFalse1: 'Lorem',
  singleReadOnlyBooleanTrue1: 'Lorem',
  singleReadOnlyCallbackFalse1: 'Lorem',
  singleReadOnlyCallbackTrue1: 'Lorem',
}

describe('@sanity/field: Multi fieldset and review changes', () => {
  let testDocumentId = ''
  let sc

  before(() => {
    cy.login()

    sc = sanityClient({
      projectId: 'ppsg7ml5',
      dataset: 'test',
      token: Cypress.env('SANITY_SESSION_TOKEN'),
      useCdn: false,
    })

    sc.create(doc).then((res) => {
      testDocumentId = res._id
      cy.visit(`/test/desk/input-ci;conditionalFieldset;${res._id}%2Csince%3D%40lastPublished`)
    })
  })

  beforeEach(() => {
    cy.viewport(2000, 3500)
  })

  // Hidden boolean false
  it('when hidden property is false, the fieldset is rendered', () => {
    cy.get('[data-testid="fieldset-multiHiddenBooleanFalse"]').should('be.visible')
  })

  //Hidden boolean true
  it('when hidden property is true, the fieldset is not rendered', () => {
    cy.get('[data-testid="fieldset-multiHiddenBooleanTrue"]').should('not.exist')
  })

  //Hidden callback false
  it('when the hidden callback returns false, the fieldset is rendered', () => {
    cy.get('[data-testid="fieldset-multiHiddenCallbackFalse"]').should('be.visible')
  })

  //Hidden callback true
  it('when the hidden callback returns true, the fieldset is not rendered', () => {
    cy.get('[data-testid="fieldset-multiHiddenCallbackTrue"]').should('not.exist')
  })

  //Read only boolean false
  it('when the readOnly property is false, the fieldset is enabled', () => {
    cy.get('[data-testid="fieldset-multiReadOnlyBooleanFalse"]')
      .find('input')
      .should('not.have.attr', 'readonly')
  })

  //Read only boolean true
  it('when the readOnly property is true, the fieldset is disabled', () => {
    cy.get('[data-testid="fieldset-multiReadOnlyBooleanTrue"]')
      .find('input')
      .should('have.attr', 'readonly')
  })

  //Read only callback false
  it('when the readOnly callback returns false, the fieldset is enabled', () => {
    cy.get('[data-testid="fieldset-multiReadOnlyCallbackFalse"]')
      .find('input')
      .should('not.have.attr', 'readonly')
  })

  //Read only callback true
  it('when the readOnly callback returns true, the fieldset is disabled', () => {
    cy.get('[data-testid="fieldset-multiReadOnlyCallbackTrue"]')
      .find('input')
      .should('have.attr', 'readonly')
  })

  /* --- Review Changes --- */

  // Hidden boolean false
  it('when hidden property is false, the review change for fieldset is rendered', () => {
    cy.get('[data-testid="group-change-multiHiddenBooleanFalse"]').should('be.visible')
  })

  // Hidden boolean true
  it('when hidden property is true, the review change for fieldset is not rendered', () => {
    cy.get('[data-testid="group-change-multiHiddenBooleanTrue"]').should('not.exist')
  })

  //Hidden callback false
  it('when the hidden callback returns false, the review change for fieldset is rendered', () => {
    cy.get('[data-testid="group-change-multiHiddenCallbackFalse"]').should('be.visible')
  })

  //Hidden callback true
  it('when the hidden callback returns true, the review change for fieldset is not rendered', () => {
    cy.get('[data-testid="group-change-multiHiddenCallbackTrue"]').should('not.exist')
  })

  //Read only boolean false
  it('when the readOnly property is false, the review change for fieldset is enabled', () => {
    cy.get('[data-testid="group-change-revert-button-multiReadOnlyBooleanFalse"]').should(
      'not.be.disabled'
    )

    cy.get('[data-testid="single-change-revert-button-multiReadOnlyBooleanFalse1"').should(
      'not.be.disabled'
    )
    cy.get('[data-testid="single-change-revert-button-multiReadOnlyBooleanFalse2"').should(
      'not.be.disabled'
    )
  })

  //Read only boolean true
  it('when the readOnly property is true, the review change for fieldset is disabled', () => {
    cy.get('[data-testid="group-change-revert-button-multiReadOnlyBooleanTrue"]').should(
      'be.disabled'
    )

    cy.get('[data-testid="single-change-revert-button-multiReadOnlyBooleanTrue1"').should(
      'be.disabled'
    )
    cy.get('[data-testid="single-change-revert-button-multiReadOnlyBooleanTrue2"').should(
      'be.disabled'
    )
  })

  //Read only callback false
  it('when the readOnly callback returns false, the review change for fieldset is enabled', () => {
    cy.get('[data-testid="group-change-revert-button-multiReadOnlyCallbackFalse"]').should(
      'not.be.disabled'
    )

    cy.get('[data-testid="single-change-revert-button-multiReadOnlyCallbackFalse1"').should(
      'not.be.disabled'
    )
    cy.get('[data-testid="single-change-revert-button-multiReadOnlyCallbackFalse2"').should(
      'not.be.disabled'
    )
  })

  //Read only callback true
  it('when the readOnly callback returns true, the review change for fieldset is disabled', () => {
    cy.get('[data-testid="group-change-revert-button-multiReadOnlyCallbackTrue"]').should(
      'be.disabled'
    )

    cy.get('[data-testid="single-change-revert-button-multiReadOnlyCallbackTrue1"').should(
      'be.disabled'
    )
    cy.get('[data-testid="single-change-revert-button-multiReadOnlyCallbackTrue2"').should(
      'be.disabled'
    )
  })

  after(() => {
    sc.delete(testDocumentId)
  })
})

describe('@sanity/field: Single fieldset and review changes', () => {
  let testDocumentId = ''
  let sc

  before(() => {
    cy.login()

    sc = sanityClient({
      projectId: 'ppsg7ml5',
      dataset: 'test',
      token: Cypress.env('SANITY_SESSION_TOKEN'),
      useCdn: false,
    })

    sc.create(doc).then((res) => {
      testDocumentId = res._id
      cy.visit(`/test/desk/input-ci;conditionalFieldset;${res._id}%2Csince%3D%40lastPublished`)
    })
  })

  beforeEach(() => {
    cy.viewport(2000, 3500)
  })

  //Hidden boolean false
  it('when hidden property is false, the fieldset is rendered', () => {
    cy.get('[data-testid="fieldset-singleHiddenBooleanFalse"]').should('be.visible')
  })

  //Hidden boolean true
  it('when hidden property is true, the fieldset is not rendered', () => {
    cy.get('[data-testid="fieldset-singleHiddenBooleanTrue"]').should('not.exist')
  })

  //Hidden callback false
  it('when hidden callback returns false, the fieldset is rendered', () => {
    cy.get('[data-testid="fieldset-singleHiddenCallbackFalse"]').should('be.visible')
  })

  //Hidden callback true
  it('when hidden callback returns true, the fieldset is not rendered', () => {
    cy.get('[data-testid="fieldset-singleHiddenCallbackTrue"]').should('not.exist')
  })

  //Read only boolean false
  it('when readOnly property is false, the fieldset is enabled', () => {
    cy.get('[data-testid="fieldset-singleReadOnlyBooleanFalse"]')
      .find('input')
      .should('not.have.attr', 'readonly')
  })

  //Read only boolean true
  it('when readOnly property is true, the fieldset is disabled', () => {
    cy.get('[data-testid="fieldset-singleReadOnlyBooleanTrue"]')
      .find('input')
      .should('have.attr', 'readonly')
  })

  //Read only callback false
  it('when readOnly callback returns false, the fieldset is not disabled', () => {
    cy.get('[data-testid="fieldset-singleReadOnlyCallbackFalse"]')
      .find('input')
      .should('not.have.attr', 'readonly')
  })

  //Read only callback true
  it('when readOnly callback returns true, the fieldset is disabled', () => {
    cy.get('[data-testid="fieldset-singleReadOnlyCallbackTrue"]')
      .find('input')
      .should('have.attr', 'readonly')
  })

  /* --- Review Changes --- */

  //Hidden boolean false
  it('when hidden property is false, the review change for fieldset is rendered', () => {
    cy.get('[data-testid="single-change-revert-button-singleHiddenBooleanFalse1"').should(
      'be.visible'
    )
  })

  //Hidden boolean true
  it('when hidden property is true, the review change for fieldset is not rendered', () => {
    cy.get('[data-testid="single-change-revert-button-singleHiddenBooleanTrue1"').should(
      'not.exist'
    )
  })

  //Hidden callback false
  it('when hidden callback returns false, the review change for fieldset is rendered', () => {
    cy.get('[data-testid="single-change-revert-button-singleHiddenCallbackFalse1"').should(
      'be.visible'
    )
  })

  //Hidden callback true
  it('when hidden callback returns true, the review change for fieldset is not rendered', () => {
    cy.get('[data-testid="single-change-revert-button-singleHiddenCallbackTrue1"').should(
      'not.exist'
    )
  })

  //Read only boolean false
  it('when readOnly property is false, the review change for fieldset is enabled', () => {
    cy.get('[data-testid="single-change-revert-button-singleReadOnlyBooleanFalse1"').should(
      'not.be.disabled'
    )
  })

  //Read only boolean true
  it('when readOnly property is true, the review change for fieldset is disabled', () => {
    cy.get('[data-testid="single-change-revert-button-singleReadOnlyBooleanTrue1"').should(
      'be.disabled'
    )
  })

  //Read only callback false
  it('when readOnly callback returns false, the review change for fieldset is not disabled', () => {
    cy.get('[data-testid="single-change-revert-button-singleReadOnlyCallbackFalse1"').should(
      'not.be.disabled'
    )
  })

  //Read only callback true
  it('when readOnly callback returns true, the review change for fieldset is disabled', () => {
    cy.get('[data-testid="single-change-revert-button-singleReadOnlyCallbackTrue1"').should(
      'be.disabled'
    )
  })

  after(() => {
    sc.delete(testDocumentId)
  })
})
