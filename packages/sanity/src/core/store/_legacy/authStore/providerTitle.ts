/** @internal */
export function getProviderTitle(provider?: string): string | undefined {
  if (provider === 'google') {
    return 'Google'
  }

  if (provider === 'github') {
    return 'GitHub'
  }

  if (provider === 'sanity') {
    return 'Sanity'
  }

  if (provider?.startsWith('saml-')) {
    return 'SAML/SSO'
  }

  return undefined
}
