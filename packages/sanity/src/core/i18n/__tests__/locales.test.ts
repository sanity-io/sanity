import {describe, expect, it} from 'vitest'

import {getFallbackLocaleSource} from '../fallback'
import {isStaticResourceBundle} from '../helpers'
import {usEnglishLocale} from '../locales'

describe('default locale resources', () => {
  it('keeps only pre-auth copy in the synchronous fallback', () => {
    const staticBundles = usEnglishLocale.bundles?.filter(isStaticResourceBundle)

    expect(staticBundles).toHaveLength(1)
    expect(staticBundles?.[0].namespace).toBe('studio')
    expect(staticBundles?.[0].resources).toEqual({
      'login.logged-out.generic': 'Your session is no longer valid. Please sign in again.',
      'login.logged-out.session-expired': 'Your session expired. Please sign in again.',
      'login.logged-out.title': "You've been logged out",
      'workspaces.action.add-workspace': 'Add workspace',
      'workspaces.action.choose-another-workspace': 'Choose another workspace',
      'workspaces.choose-your-workspace-label': 'Choose your workspace',
    })
  })

  it('provides authentication and workspace-chooser copy before post-auth namespaces load', () => {
    const fallback = getFallbackLocaleSource()

    expect(fallback.t('login.logged-out.title')).toBe("You've been logged out")
    expect(fallback.t('login.logged-out.session-expired')).toBe(
      'Your session expired. Please sign in again.',
    )
    expect(fallback.t('workspaces.choose-your-workspace-label')).toBe('Choose your workspace')
    expect(fallback.t('workspaces.action.choose-another-workspace')).toBe(
      'Choose another workspace',
    )
  })

  it('loads the full Studio bundle asynchronously', async () => {
    const fullStudioBundle = usEnglishLocale.bundles?.[1]

    expect(typeof fullStudioBundle?.resources).toBe('function')
    if (!fullStudioBundle || typeof fullStudioBundle.resources !== 'function') {
      throw new Error('Expected the full Studio locale bundle to be asynchronous')
    }

    const resources = await fullStudioBundle.resources()
    expect(resources).toHaveProperty('workspaces.title', 'Workspaces')
  })
})
