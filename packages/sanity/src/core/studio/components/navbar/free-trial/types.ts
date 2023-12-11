import {PortableTextBlock} from '@sanity/types'

export interface FreeTrialResponse {
  _type: 'planButton'
  _id: string
  _rev: string
  _updatedAt: string
  _createdAt: string
  icon: string
  id: string
  style: string
  text: string
  showOnLoad: 'popover' | 'modal'
  popover?: FreeTrialDialog
  modal?: FreeTrialDialog
  daysLeft: number
}
export interface FreeTrialDialog {
  _id: string
  _type: 'dialog'
  _createdAt: string
  ctaButton?: {
    text: string
    url: string
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
