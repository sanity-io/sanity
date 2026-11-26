import {describe, expect, it} from 'vitest'

import {getFallbackLocaleSource} from '../fallback'
import {isStaticResourceBundle} from '../helpers'
import {studioLocaleNamespace} from '../localeNamespaces'
import {usEnglishLocale} from '../locales'

describe('default locale resources', () => {
  it('loads only the studio strings on demand', () => {
    const lazyBundles = usEnglishLocale.bundles?.filter((bundle) => !isStaticResourceBundle(bundle))

    expect(lazyBundles?.map((bundle) => bundle.namespace)).toEqual([studioLocaleNamespace])
    expect(usEnglishLocale.bundles?.filter(isStaticResourceBundle)).toHaveLength(3)
  })

  it('provides authentication copy before a workspace source loads', async () => {
    const fallback = getFallbackLocaleSource()
    await fallback.loadNamespaces([studioLocaleNamespace])

    expect(fallback.t('login.logged-out.title')).toBe("You've been logged out")
    expect(fallback.t('login.logged-out.session-expired')).toBe(
      'Your session expired. Please sign in again.',
    )
    expect(fallback.t('workspaces.choose-your-workspace-label')).toBe('Choose your workspace')
  })
})
