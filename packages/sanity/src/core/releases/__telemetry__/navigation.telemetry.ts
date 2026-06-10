import {defineEvent} from '@sanity/telemetry'

/**
 * UI surface the releases navigation was initiated from.
 *
 * Local vocabulary for the `location` convention (snake_case string union).
 */
type ReleasesNavigationLocation = 'menu' | 'view_picker'

interface NavigationLocationInfo {
  /**
   * UI surface the navigation was initiated from
   */
  location: ReleasesNavigationLocation
}

// Event when user navigates to releases overview
export const NavigatedToReleasesOverview = defineEvent<NavigationLocationInfo>({
  name: 'Navigated to Content Releases',
  version: 1,
  description: 'User navigated to the content releases list view',
})

// Event when user navigates to scheduled drafts view
export const NavigatedToScheduledDrafts = defineEvent<NavigationLocationInfo>({
  name: 'Navigated to Scheduled Drafts',
  version: 1,
  description: 'User navigated to the scheduled drafts list view',
})
