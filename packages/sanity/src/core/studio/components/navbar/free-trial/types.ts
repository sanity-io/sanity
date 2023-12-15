import {PortableTextBlock} from '@sanity/types'

export interface FreeTrialResponse {
  id: string
  icon: string
  style: string
  showOnLoad: FreeTrialDialog | null
  showOnClick: FreeTrialDialog | null
  daysLeft: number
  totalDays: number
}
export interface FreeTrialDialog {
  _id: string
  _type: 'dialog'
  _createdAt: string
  ctaButton?: {
    text: string
    action: 'openNext' | 'closeDialog' | 'openUrl'
    url?: string
  }
  secondaryButton?: {
    text: string
  }
  descriptionText: PortableTextBlock[]
  dialogType: 'modal' | 'popover'
  headingText: string
  id: string
  image: Image | null
  tags?: Tag[]
  _rev: string
  _updatedAt: string
}

interface Tag {
  _type: 'tag'
  _key: string
  tag: string
}

interface Image {
  asset: {
    url: string
    altText: string | null
  }
}
