import {defineEvent} from '@sanity/telemetry'

interface ProductAnnouncementSharedProperties {
  announcement_id: string
  announcement_title: string
  announcement_internal_name: string
  source: 'studio'
  studio_version?: string
}

/**
 * UI surface the announcement was presented on.
 * `location` follows the SAPP-3815 generic-name + property convention.
 */
type AnnouncementLocation = 'card' | 'help_menu'

export const ProductAnnouncementCardSeen = defineEvent<ProductAnnouncementSharedProperties>({
  name: 'Product Announcement Card Seen',
  version: 1,
  description: 'User viewed the product announcement card',
})

export const ProductAnnouncementCardClicked = defineEvent<ProductAnnouncementSharedProperties>({
  name: 'Product Announcement Card Clicked',
  version: 1,
  description: 'User clicked the product announcement card',
})

export const ProductAnnouncementCardDismissed = defineEvent<ProductAnnouncementSharedProperties>({
  name: 'Product Announcement Card Dismissed',
  version: 1,
  description: 'User dismissed the product announcement card',
})

export const ProductAnnouncementViewed = defineEvent<
  ProductAnnouncementSharedProperties & {scrolled_into_view: boolean; location: AnnouncementLocation}
>({
  name: 'Product Announcement Viewed',
  version: 1,
  description: 'User viewed the product announcement',
})

export const ProductAnnouncementLinkClicked = defineEvent<
  ProductAnnouncementSharedProperties & {
    link_url: string
    link_title: string
    location: AnnouncementLocation
  }
>({
  name: 'Product Announcement Link Clicked',
  version: 1,
  description: 'User clicked the link in the product announcement ',
})

export const ProductAnnouncementModalDismissed = defineEvent<
  ProductAnnouncementSharedProperties & {
    location: AnnouncementLocation
  }
>({
  name: 'Product Announcement Dismissed',
  version: 1,
  description: 'User dismissed the product announcement modal ',
})

export const WhatsNewHelpMenuItemClicked = defineEvent<ProductAnnouncementSharedProperties>({
  name: 'Whats New Help Menu Item Clicked',
  version: 1,
  description: 'User clicked the "Whats new" help menu item',
})
