Cypress.Commands.add('login', (sanitySessionToken) => {
  const token = sanitySessionToken || Cypress.env('SANITY_SESSION_TOKEN')

  if (!token) {
    throw new Error('Missing sanity token')
  }

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
