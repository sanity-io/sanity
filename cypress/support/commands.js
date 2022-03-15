export function applyCypressCommands() {
  Cypress.Commands.add('login', (sanitySessionToken) => {
    const token = sanitySessionToken || Cypress.env('SANITY_SESSION_TOKEN')

    if (!token) {
      throw new Error('Missing sanity token')
    }

    cy.intercept({url: '*/**/users/me*', method: 'GET'}).as('getUser')

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
    return cy.get(`[data-testid="input-${fieldName}"]`)
  })

  Cypress.Commands.add('getFieldInput', (fieldName) => {
    return cy.getField(fieldName).within(() => {
      return cy.get('input')
    })
  })
}
