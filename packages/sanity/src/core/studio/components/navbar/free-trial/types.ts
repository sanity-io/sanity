export interface FreeTrialDialog {
  _id: string
  _type: 'dialog'
  _createdAt: string
  ctaButton?: CtaButton
  descriptionText: string
  dialogType: 'modal' | 'popover'
  headingText: string
  id: string
  image: Image
  links: Link[]
  tags: Tag[]
  _rev: string
  _updatedAt: string
}

interface Tag {
  _type: 'tag'
  _key: string
  tag: string
}

interface Link {
  _key: string
  _type: 'links'
  text: string
  url: string
}

interface Image {
  _type: string
  asset: Asset
}

interface Asset {
  _ref: string
  _type: string
  url: string
  altText: string
}

interface CtaButton {
  text: string
  url: string
}
