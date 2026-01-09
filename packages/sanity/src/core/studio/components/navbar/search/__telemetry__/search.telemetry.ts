import {defineEvent} from '@sanity/telemetry'

export const RecentSearchClicked = defineEvent({
  name: 'Recent Search Viewed',
  version: 1,
  description: 'User clicked on a recent search item to reapply it',
})
