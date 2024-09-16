import {defineEvent} from '@sanity/telemetry'

interface ProductAnnouncementSharedProperties {
  announcement_id: string
  announcement_title: string
  source: 'studio'
  studio_version?: string
  // TODO: Aren't this added automatically?
  project_id?: string
  organization_id?: string
}

type origin = 'card' | 'help_menu'

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
  ProductAnnouncementSharedProperties & {scrolled_into_view: boolean; origin: origin}
>({
  name: 'Product Announcement Viewed',
  version: 1,
  description: 'User viewed the product announcement',
})

export const ProductAnnouncementLinkClicked = defineEvent<
  ProductAnnouncementSharedProperties & {
    link_url: string
    link_title: string
    origin: origin
  }
>({
  name: 'Product Announcement Link Clicked',
  version: 1,
  description: 'User clicked the link in the product announcement ',
})

export const ProductAnnouncementModalDismissed = defineEvent<
  ProductAnnouncementSharedProperties & {
    origin: origin
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
