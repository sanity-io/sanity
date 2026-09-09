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
      'workspaces.action.add-workspace': 'Add workspace',
      'workspaces.action.choose-another-workspace': 'Choose another workspace',
      'workspaces.choose-your-workspace-label': 'Choose your workspace',
    })
  })

  it('provides authentication copy before post-auth namespaces load', () => {
    const fallback = getFallbackLocaleSource()

    expect(fallback.t('login.logged-out.title')).toBe("You've been logged out")
    expect(fallback.t('login.logged-out.session-expired')).toBe(
      'Your session expired. Please sign in again.',
    )
    expect(fallback.t('workspaces.choose-your-workspace-label')).toBe('Choose your workspace')
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
    const fullResources = 'default' in resources ? resources.default : resources
    const authBundle = usEnglishLocale.bundles?.find(
      (bundle) => bundle.namespace === 'studio' && isStaticResourceBundle(bundle),
    )

    expect(fullResources).toHaveProperty('workspaces.title', 'Workspaces')
    for (const [key, value] of Object.entries(authBundle?.resources ?? {})) {
      expect(fullResources).toHaveProperty(key, value)
    }
  })
})
