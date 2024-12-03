import {type SanityUser} from '../types'

export function getProviderName(provider: SanityUser['provider']) {
  if (provider === 'google') return 'Google'
  if (provider === 'github') return 'GitHub'
  if (provider === 'sanity') return 'Email'
  if (provider.startsWith('saml-')) return 'SAML'
  return provider
}
