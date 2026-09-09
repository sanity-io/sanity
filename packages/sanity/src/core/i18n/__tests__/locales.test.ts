import {describe, expect, it} from 'vitest'

import {getFallbackLocaleSource} from '../fallback'
import {isStaticResourceBundle} from '../helpers'
import {usEnglishLocale} from '../locales'

describe('default locale resources', () => {
  it('keeps authentication and headless validation copy in the synchronous fallback', () => {
    const staticBundles = usEnglishLocale.bundles?.filter(isStaticResourceBundle)
    const authBundle = staticBundles?.find((bundle) => bundle.namespace === 'studio')

    expect(staticBundles).toHaveLength(2)
    expect(authBundle?.resources).toEqual({
      'login.logged-out.generic': 'Your session is no longer valid. Please sign in again.',
      'login.logged-out.session-expired': 'Your session expired. Please sign in again.',
      'login.logged-out.title': "You've been logged out",
    })
  })

  it('provides authentication copy before post-auth namespaces load', () => {
    const fallback = getFallbackLocaleSource()

    expect(fallback.t('login.logged-out.title')).toBe("You've been logged out")
    expect(fallback.t('login.logged-out.session-expired')).toBe(
      'Your session expired. Please sign in again.',
    )
  })

  it('loads the full Studio bundle asynchronously', async () => {
    const fullStudioBundle = usEnglishLocale.bundles?.find(
      (bundle) => bundle.namespace === 'studio' && !isStaticResourceBundle(bundle),
    )

    expect(typeof fullStudioBundle?.resources).toBe('function')
    if (!fullStudioBundle || typeof fullStudioBundle.resources !== 'function') {
      throw new Error('Expected the full Studio locale bundle to be asynchronous')
    }

    const resources = await fullStudioBundle.resources()
    expect(resources).toHaveProperty('workspaces.title', 'Workspaces')
  })
})
