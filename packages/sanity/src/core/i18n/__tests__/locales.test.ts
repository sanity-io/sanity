import {describe, expect, it} from 'vitest'

import {getFallbackLocaleSource} from '../fallback'
import {isStaticResourceBundle} from '../helpers'
import {usEnglishLocale} from '../locales'

describe('default locale resources', () => {
  it('keeps all default resources synchronous', () => {
    const staticBundles = usEnglishLocale.bundles?.filter(isStaticResourceBundle)

    expect(staticBundles).toHaveLength(4)
  })

  it('provides authentication copy before a workspace source loads', () => {
    const fallback = getFallbackLocaleSource()

    expect(fallback.t('login.logged-out.title')).toBe("You've been logged out")
    expect(fallback.t('login.logged-out.session-expired')).toBe(
      'Your session expired. Please sign in again.',
    )
    expect(fallback.t('workspaces.choose-your-workspace-label')).toBe('Choose your workspace')
  })
})
