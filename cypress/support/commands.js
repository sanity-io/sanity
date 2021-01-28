import guidGenerator from './guidGenerator'

Cypress.Commands.add('login', (sanitySessionToken) => {
  const token = sanitySessionToken ? sanitySessionToken : Cypress.env('SANITY_SESSION_TOKEN')

  cy.intercept({url: 'v1/users/me', method: 'GET'}).as('getUser')

  return cy.visit('/').then(() => {
    cy.wait('@getUser').then((interception) => {
      const domain = new URL(interception.response.url).hostname

      cy.setCookie('sanitySession', token, {
        secure: true,
        httpOnly: true,
        sameSite: 'None',
        domain: `.${domain}`,
      })
    })
  })
})

Cypress.Commands.add('getField', (fieldName) => {
  // TODO(@benedicteb, 2021-01-26) Add <data-qa=..." /> or something to html to make select super robust
  return cy.get(`[data-focus-path=${fieldName}]`)
})

Cypress.Commands.add('getFieldInput', (fieldName) => {
  return cy.getField(fieldName).within(($field) => {
    return cy.get('input')
  })
})

Cypress.Commands.add('createDocument', (documentType) => {
  cy.visit(`/intent/create/template=${documentType};type=${documentType}/`)

  return cy.url().then((url) => {
    const [uri, documentData] = unescape(url).split(';')
    const [documentId, _] = documentData.split(',')

    return documentId
  })
})

Cypress.Commands.add('createAndPublishDocument', (documentType) => {
  cy.visit(`/intent/create/template=${documentType};type=${documentType}/`)

  cy.getFieldInput('title').type(`Cypress test document [${guidGenerator()}]`)

  // Publish the document
  cy.getFieldInput('title').type(`{ctrl+alt+p}`)

  // TODO(@benedicteb, 2021-01-28) Find a better way to know when mutations are done
  // It's difficult to use cy.intercept because there are a lot of requests
  // to the same url
  cy.wait(2000)

  return cy.getOpenDocumentId()
})

Cypress.Commands.add('getOpenDocumentId', () => {
  return cy.url().then((url) => {
    const [uri, documentData] = unescape(url).split(';')
    const [documentId, _] = documentData.split(',')

    return documentId
  })
})

Cypress.Commands.add('deleteDocument', (documentId) => {
  cy.navigateToDocument(documentId)

  cy.wait(2000)

  cy.get('button[aria-label=Actions]').click()
  cy.get('button[aria-label=Delete]').click()
  cy.contains('Delete now').click()
})

Cypress.Commands.add('navigateToDocument', (documentId) => {
  cy.get('input[placeholder=Search]').type(documentId)

  cy.intercept({url: /.*v1\/data\/query.*/}).as('searchForDocument')
  cy.wait('@searchForDocument')

  cy.get('a[data-hit-index=0]').click()
})
