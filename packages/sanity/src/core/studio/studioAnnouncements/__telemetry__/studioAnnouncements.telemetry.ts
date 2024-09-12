import {defineEvent} from '@sanity/telemetry'

export const StudioAnnouncementCardSeen = defineEvent({
  name: 'Studio Announcement Card Seen',
  version: 1,
  description: 'User viewed the studio announcement card',
})

export const StudioAnnouncementCardClicked = defineEvent({
  name: 'Studio Announcement Card Clicked',
  version: 1,
  description: 'User clicked the studio announcement card',
})

export const StudioAnnouncementCardDismissed = defineEvent({
  name: 'Studio Announcement Card Dismissed',
  version: 1,
  description: 'User dismissed the studio announcement card',
})

export const StudioAnnouncementModalLinkClicked = defineEvent({
  name: 'Studio Announcement Modal Link Clicked',
  version: 1,
  description: 'User clicked the link in the studio announcement modal',
})

export const StudioAnnouncementModalDismissed = defineEvent({
  name: 'Studio Announcement Modal Dismissed',
  version: 1,
  description: 'User dismissed the studio announcement modal',
})
