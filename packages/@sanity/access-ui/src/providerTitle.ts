/**
 * Human-readable title for a login provider id, e.g. `google` → `Google`,
 * `saml-xyz` → `SAML/SSO`.
 *
 * @public
 */
export function getProviderTitle(provider?: string): string | undefined {
  if (provider === 'google') return 'Google'
  if (provider === 'github') return 'GitHub'
  if (provider === 'sanity') return 'Sanity'
  if (provider === 'vercel') return 'Vercel'
  if (provider?.startsWith('saml-')) return 'SAML/SSO'
  return undefined
}
