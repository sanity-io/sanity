import {Image, PortableTextBlock} from '@sanity/types'

interface WelcomeVideo {
  link?: Link
  videos?: Video[]
}

interface Video {
  description?: PortableTextBlock[]
  image?: Image
  title?: string
  youtube?: YouTube[]
}

interface Link {
  url?: string
  title?: string
}

interface YouTube {
  duration?: number
  url?: string
  videoId?: string
}

interface Resource {
  sectionArray?: Section[]
  title?: string
}

export interface Section {
  _key: string
  /* @todo Update with the correct version when released  */
  /** @deprecated No longer displayed in Sanity Studio 3.xx.x */
  sectionTitle?: string
  items?: (InternalAction | ExternalLink)[]
}

interface Item {
  _key: string
  title?: string
}

interface ExternalLink extends Item {
  _type: 'externalLink'
  url?: string
}

interface InternalAction extends Item {
  _type: 'internalAction'
  type?: InternalActionType
}

type InternalActionType = 'show-welcome-modal'

/**
 * @hidden
 * @beta */
export interface ResourcesResponse {
  resources?: Resource
  welcome?: WelcomeVideo
  latestVersion?: string
}
