import {defineEvent} from '@sanity/telemetry'

// Parameter interface to distinguish navigation source
interface NavigationSourceInfo {
  source: 'menu' | 'view-picker'
}

// Event when user navigates to releases overview
export const NavigatedToReleasesOverview = defineEvent<NavigationSourceInfo>({
  name: 'Navigated to Content Releases',
  version: 1,
  description: 'User navigated to the content releases list view',
})

// Event when user navigates to scheduled drafts view
export const NavigatedToScheduledDrafts = defineEvent<NavigationSourceInfo>({
  name: 'Navigated to Scheduled Drafts',
  version: 1,
  description: 'User navigated to the scheduled drafts list view',
})
